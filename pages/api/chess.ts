import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "@/lib/socket-types";

type ChessMove = { from: string; to: string };

// In-memory game registry to stabilize color/turn assignments
type GameInfo = {
  creatorId: string;
  players: Set<string>; // socket ids
  currentTurn: "white" | "black";
};
const games = new Map<string, GameInfo>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function ChessSocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!res.socket.server.chessIo) {
      const io = new ServerIO(res.socket.server, {
        path: "/api/chess-io",
        addTrailingSlash: false,
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      res.socket.server.chessIo = io;

      io.on("connection", (socket) => {
        // Create
        socket.on(
          "chess:create",
          (ack?: (payload: { gameCode: string }) => void) => {
            try {
              const gameCode = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
              socket.join(gameCode);
              // Register game with this socket as creator (white)
              games.set(gameCode, {
                creatorId: socket.id,
                players: new Set([socket.id]),
                currentTurn: "white",
              });
              socket.emit("chess:gameCreated", { gameCode });
              if (typeof ack === "function") ack({ gameCode });
            } catch (e) {
              socket.emit("chess:error", { message: "Failed to create game" });
            }
          }
        );

        // Join
        socket.on(
          "chess:join",
          (
            { gameCode }: { gameCode: string },
            ack?: (res: { ok: boolean; message?: string }) => void
          ) => {
            try {
              const info = games.get(gameCode);
              if (!info) {
                socket.emit("chess:error", { message: "Game not found" });
                if (typeof ack === "function")
                  ack({ ok: false, message: "Game not found" });
                return;
              }

              const isCreator = socket.id === info.creatorId;
              const inRoomAlready = info.players.has(socket.id);

              if (inRoomAlready) {
                // Re-join on refresh or dup navigate: just re-emit color and current turn if game started
                socket.emit("chess:joined", {
                  color: isCreator ? "white" : "black",
                  gameCode,
                });
                if (info.players.size === 2) {
                  const yourTurn = isCreator
                    ? info.currentTurn === "white"
                    : info.currentTurn === "black";
                  socket.emit("chess:turn", { yourTurn });
                }
                if (typeof ack === "function") ack({ ok: true });
                return;
              }

              if (info.players.size >= 2) {
                socket.emit("chess:error", {
                  message: "Game not found or full",
                });
                if (typeof ack === "function")
                  ack({ ok: false, message: "Game not found or full" });
                return;
              }

              // Add second player
              info.players.add(socket.id);
              socket.join(gameCode);

              // Emit color to both players deterministically
              const creatorSocketId = info.creatorId;
              io.to(creatorSocketId).emit("chess:joined", {
                color: "white",
                gameCode,
              });
              socket.emit("chess:joined", { color: "black", gameCode });

              // Start game and set initial turn to white (creator)
              io.to(gameCode).emit("chess:gameStart");
              info.currentTurn = "white";
              io.to(creatorSocketId).emit("chess:turn", { yourTurn: true });
              socket.emit("chess:turn", { yourTurn: false });
              if (typeof ack === "function") ack({ ok: true });
            } catch (e) {
              socket.emit("chess:error", { message: "Failed to join game" });
              if (typeof ack === "function")
                ack({ ok: false, message: "Failed to join game" });
            }
          }
        );

        // Moves
        socket.on(
          "chess:move",
          ({ gameCode, move }: { gameCode: string; move: ChessMove }) => {
            try {
              // Send move to opponent and give them the turn
              socket.to(gameCode).emit("chess:moveReceived", move);
              const info = games.get(gameCode);
              if (info) {
                const moverIsCreator = socket.id === info.creatorId;
                // If game has already been marked concluded, ignore further turn changes
                if ((info as any).finished) return;
                info.currentTurn = moverIsCreator ? "black" : "white";
                // Opponent gets the turn, mover loses
                socket.to(gameCode).emit("chess:turn", { yourTurn: true });
                socket.emit("chess:turn", { yourTurn: false });
              } else {
                // Fallback if info missing
                socket.to(gameCode).emit("chess:turn", { yourTurn: true });
                socket.emit("chess:turn", { yourTurn: false });
              }
            } catch (e) {
              socket.emit("chess:error", { message: "Failed to make move" });
            }
          }
        );

        // Game Over broadcast
        socket.on(
          "chess:gameOver",
          ({
            gameCode,
            reason,
            winner,
          }: {
            gameCode: string;
            reason: string;
            winner?: "white" | "black";
          }) => {
            try {
              const info = games.get(gameCode);
              if (info) (info as any).finished = true;
              socket.to(gameCode).emit("chess:gameOver", { reason, winner });
              socket.emit("chess:gameOver", { reason, winner });
              // Keep game entry briefly to avoid late events; will be cleaned on leave
            } catch (e) {
              // ignore
            }
          }
        );

        // Leave
        socket.on(
          "chess:leave",
          (
            { gameCode }: { gameCode: string },
            ack?: (res: { ok: boolean; message?: string }) => void
          ) => {
            try {
              socket.leave(gameCode);
              const info = games.get(gameCode);
              if (info) {
                info.players.delete(socket.id);
                if (info.players.size === 0) {
                  games.delete(gameCode);
                }
              }
              if (typeof ack === "function") ack({ ok: true });
            } catch (e) {
              if (typeof ack === "function")
                ack({ ok: false, message: "Failed to leave game" });
            }
          }
        );
      });
    }

    res.status(200).end("ok");
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

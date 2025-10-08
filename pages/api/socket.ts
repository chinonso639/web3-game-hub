import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";
import { NextApiResponseServerIo, gameManager } from "@/lib/socket";
import { NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
//v1
export default async function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (!res.socket.server.io) {
    console.log("🚀 New Socket.io server...");

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("🔌 User connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        gameManager.removePlayer(socket.id);
      });

      socket.on("create-game", async ({ walletAddress }) => {
        try {
          const gameCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

          let player = await prisma.player.findUnique({
            where: { walletAddress },
          });
          if (!player) {
            player = await prisma.player.create({ data: { walletAddress } });
          }

          const game = await prisma.game.create({
            data: { gameCode, player1Id: player.id, status: "waiting" },
          });

          const gameState = gameManager.createGame(
            gameCode,
            socket.id,
            player.nickname || "Anonymous"
          );
          socket.join(gameCode);
          socket.emit("game-created", { gameCode, gameState });
        } catch (error) {
          console.error("Error creating game:", error);
          socket.emit("error", "Failed to create game");
        }
      });

      socket.on("join-game", async ({ gameCode, walletAddress }) => {
        try {
          let player = await prisma.player.findUnique({
            where: { walletAddress },
          });
          if (!player) {
            player = await prisma.player.create({ data: { walletAddress } });
          }

          const game = await prisma.game.findUnique({ where: { gameCode } });
          if (!game) {
            socket.emit("error", "Game not found");
            return;
          }
          if (game.player2Id) {
            socket.emit("error", "Game is full");
            return;
          }

          await prisma.game.update({
            where: { gameCode },
            data: { player2Id: player.id, status: "active" },
          });

          const gameState = gameManager.joinGame(
            gameCode,
            socket.id,
            player.nickname || "Anonymous"
          );
          if (gameState) {
            socket.join(gameCode);
            console.log(
              "Player joined game:",
              gameCode,
              "Players:",
              gameState.players.length
            );

            // Emit to all players in the room
            io.to(gameCode).emit("player-joined", gameState);

            // Add a small delay to ensure state is synchronized
            setTimeout(() => {
              console.log("Starting game for room:", gameCode);
              io.to(gameCode).emit("game-start", gameState);
            }, 100);
          } else {
            socket.emit("error", "Failed to join game");
          }
        } catch (error) {
          console.error("Error joining game:", error);
          socket.emit("error", "Failed to join game");
        }
      });

      socket.on("make-guess", (data: { guess: number }) => {
        try {
          const gameState = gameManager.getPlayerGame(socket.id);
          if (!gameState) {
            socket.emit("error", "Not in a game");
            return;
          }

          const playerIndex = gameState.players.indexOf(socket.id);
          const round = gameState.rounds[gameState.currentRound - 1] || {};

          if (playerIndex === 0) round.player1Guess = data.guess;
          else round.player2Guess = data.guess;

          gameState.rounds[gameState.currentRound - 1] = round;

          if (
            round.player1Guess !== undefined &&
            round.player2Guess !== undefined
          ) {
            const correct = Math.floor(Math.random() * 2);
            round.correctAnswer = correct;

            const p1Win = round.player1Guess === correct;
            const p2Win = round.player2Guess === correct;
            round.winner = p1Win && !p2Win ? 0 : p2Win && !p1Win ? 1 : null;

            if (gameState.currentRound >= 5) {
              const p1Wins = gameState.rounds.filter(
                (r) => r.winner === 0
              ).length;
              const p2Wins = gameState.rounds.filter(
                (r) => r.winner === 1
              ).length;
              gameState.status = "completed";
              gameState.winner =
                p1Wins > p2Wins
                  ? gameState.players[0]
                  : p2Wins > p1Wins
                  ? gameState.players[1]
                  : undefined;
              gameState.winnerUsername =
                p1Wins > p2Wins
                  ? gameState.playerUsernames[0]
                  : p2Wins > p1Wins
                  ? gameState.playerUsernames[1]
                  : undefined;
            }

            io.to(gameState.gameCode).emit("round-complete", {
              roundData: round,
              gameState,
            });

            if (
              gameState.currentRound < 5 &&
              gameState.status !== "completed"
            ) {
              setTimeout(() => {
                gameState.currentRound++;
                io.to(gameState.gameCode).emit("next-round", gameState);
              }, 3000);
            }
          } else {
            io.to(gameState.gameCode).emit("guess-received", {
              playerId: socket.id,
              gameState,
            });
          }
        } catch (error) {
          console.error("Error making guess:", error);
          socket.emit("error", "Failed to make guess");
        }
      });
    });

    res.socket.server.io = io;
  }

  // ✅ Correct response (fixes 400 Bad Request)
  (res as unknown as NextApiResponse).status(200).end();
}

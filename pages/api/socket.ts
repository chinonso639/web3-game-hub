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
      // Increase tolerance so backgrounded tabs don't drop easily
      pingInterval: 25000,
      pingTimeout: 60000,
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
            player.nickname || "Anonymous",
            walletAddress
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
            player.nickname || "Anonymous",
            walletAddress
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

      // Allow a client to reattach to an existing game after reconnect/background
      socket.on(
        "rejoin-game",
        ({
          gameCode,
          walletAddress,
        }: {
          gameCode: string;
          walletAddress: string;
        }) => {
          try {
            const game = gameManager.getGame(gameCode);
            if (!game) {
              socket.emit("error", "Game not found");
              return;
            }
            const updated = gameManager.reconnectPlayer(
              gameCode,
              walletAddress,
              socket.id
            );
            if (!updated) {
              socket.emit("error", "Unable to rejoin game");
              return;
            }
            socket.join(gameCode);
            // Send current state to the rejoined player only
            socket.emit("game-sync", updated);
          } catch (err) {
            console.error("Error rejoining game:", err);
            socket.emit("error", "Failed to rejoin game");
          }
        }
      );

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

      socket.on("start-round-timer", (gameCode: string) => {
        // Start 30-second timer for the first round when game starts
        setTimeout(() => {
          const gameState = gameManager.getGame(gameCode);
          if (!gameState || gameState.status === "completed") return;

          const currentRound =
            gameState.rounds[gameState.currentRound - 1] || {};

          // Check if both players have made their guesses
          if (
            currentRound.player1Guess !== undefined &&
            currentRound.player2Guess !== undefined
          ) {
            return; // Round already completed
          }

          // Determine who didn't guess and make them lose
          const correct = Math.floor(Math.random() * 2);
          currentRound.correctAnswer = correct;

          if (
            currentRound.player1Guess === undefined &&
            currentRound.player2Guess === undefined
          ) {
            // Both players timed out - it's a draw
            currentRound.player1Guess = -1; // -1 indicates timeout
            currentRound.player2Guess = -1;
            currentRound.winner = null;
            currentRound.timeoutReason = "both";
          } else if (currentRound.player1Guess === undefined) {
            // Player 1 timed out, Player 2 wins
            currentRound.player1Guess = -1;
            currentRound.winner = 1;
            currentRound.timeoutReason = "player1";
          } else if (currentRound.player2Guess === undefined) {
            // Player 2 timed out, Player 1 wins
            currentRound.player2Guess = -1;
            currentRound.winner = 0;
            currentRound.timeoutReason = "player2";
          }

          gameState.rounds[gameState.currentRound - 1] = currentRound;

          // Check if game is complete
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
                ? gameState.playerUsernames?.[0]
                : p2Wins > p1Wins
                ? gameState.playerUsernames?.[1]
                : undefined;
          }

          io.to(gameCode).emit("round-complete", {
            roundData: currentRound,
            gameState,
          });

          if (gameState.currentRound < 5 && gameState.status !== "completed") {
            setTimeout(() => {
              // Only increment and emit if not completed
              if (gameState.status !== "completed") {
                gameState.currentRound++;
                io.to(gameCode).emit("next-round", gameState);
              }
            }, 3000);
          }
        }, 30000); // 30 second timer
      });

      socket.on("time-up", ({ gameCode }) => {
        const gameState = gameManager.getGame(gameCode);
        if (!gameState || gameState.status === "completed") return;
        const round = gameState.rounds[gameState.currentRound - 1] || {};
        let roundJustCompleted = false;
        // If both players haven't guessed, mark as draw
        if (
          round.player1Guess === undefined &&
          round.player2Guess === undefined
        ) {
          const correct = Math.floor(Math.random() * 2);
          round.correctAnswer = correct;
          round.player1Guess = -1;
          round.player2Guess = -1;
          round.winner = null;
          round.timeoutReason = "both";
          gameState.rounds[gameState.currentRound - 1] = round;
          roundJustCompleted = true;
        } else {
          // Only process if player hasn't guessed yet
          const playerIndex = gameState.players.indexOf(socket.id);
          if (
            (playerIndex === 0 && round.player1Guess === undefined) ||
            (playerIndex === 1 && round.player2Guess === undefined)
          ) {
            const correct = Math.floor(Math.random() * 2);
            round.correctAnswer = correct;
            if (playerIndex === 0) {
              round.player1Guess = -1;
              round.winner = 1;
              round.timeoutReason = "player1";
            } else if (playerIndex === 1) {
              round.player2Guess = -1;
              round.winner = 0;
              round.timeoutReason = "player2";
            }
            gameState.rounds[gameState.currentRound - 1] = round;
            roundJustCompleted = true;
          }
        }
        // Only increment round if a round was just completed
        if (roundJustCompleted) {
          // Check if game is complete
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
                ? gameState.playerUsernames?.[0]
                : p2Wins > p1Wins
                ? gameState.playerUsernames?.[1]
                : undefined;
          }
          io.to(gameCode).emit("round-complete", {
            roundData: round,
            gameState,
          });
          if (gameState.currentRound < 5 && gameState.status !== "completed") {
            setTimeout(() => {
              if (gameState.status !== "completed") {
                gameState.currentRound++;
                io.to(gameCode).emit("next-round", gameState);
              }
            }, 3000);
          }
        }
      });
    });

    res.socket.server.io = io;
  }

  // ✅ Correct response (fixes 400 Bad Request)
  (res as unknown as NextApiResponse).status(200).end();
}

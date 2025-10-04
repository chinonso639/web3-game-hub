import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";
import { prisma } from "./prisma";
//v1
export type NextApiResponseServerIo = {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
} & NextApiRequest;

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface GameState {
  gameCode: string;
  players: string[];
  playerUsernames: string[];
  currentRound: number;
  rounds: any[];
  status: string;
  winner?: string;
  winnerUsername?: string;
}

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map();

  createGame(gameCode: string, playerId: string, username: string): GameState {
    console.log(
      `[GameManager] createGame called with gameCode=${gameCode}, playerId=${playerId}, username=${username}`
    );
    const gameState: GameState = {
      gameCode,
      players: [playerId],
      playerUsernames: [username],
      currentRound: 1,
      rounds: [],
      status: "waiting",
    };

    this.games.set(gameCode, gameState);
    this.playerToGame.set(playerId, gameCode);
    console.log(`[GameManager] Game created:`, gameState);

    return gameState;
  }

  joinGame(
    gameCode: string,
    playerId: string,
    username: string
  ): GameState | null {
    console.log(
      `[GameManager] joinGame called with gameCode=${gameCode}, playerId=${playerId}, username=${username}`
    );
    const game = this.games.get(gameCode);
    if (!game || game.players.length >= 2) return null;

    game.players.push(playerId);
    game.playerUsernames.push(username);
    game.status = "active";
    this.playerToGame.set(playerId, gameCode);
    console.log(`[GameManager] Player joined:`, game);

    return game;
  }

  getGame(gameCode: string): GameState | undefined {
    return this.games.get(gameCode);
  }

  getPlayerGame(playerId: string): GameState | undefined {
    const gameCode = this.playerToGame.get(playerId);
    return gameCode ? this.games.get(gameCode) : undefined;
  }

  removePlayer(playerId: string): void {
    const gameCode = this.playerToGame.get(playerId);
    if (gameCode) {
      const game = this.games.get(gameCode);
      if (game) {
        game.players = game.players.filter((p) => p !== playerId);
        if (game.players.length === 0) {
          this.games.delete(gameCode);
        }
      }
      this.playerToGame.delete(playerId);
    }
  }
}

export const gameManager = new GameManager();

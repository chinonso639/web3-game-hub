import { Server as NetServer } from "http";
import { NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

export interface ExtendedNetServer extends NetServer {
  io?: ServerIO;
  chessIo?: ServerIO;
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: ExtendedNetServer;
  };
};

export type GameState = {
  gameCode: string;
  players: string[];
  playerUsernames: string[];
  currentRound: number;
  rounds: any[];
  status: string;
  winner?: string;
  winnerUsername?: string;
};

export class GameManager {
  private games: Map<string, GameState>;
  private playerToGame: Map<string, string>;

  constructor() {
    this.games = new Map();
    this.playerToGame = new Map();
  }

  createGame(gameCode: string, initialState: GameState): void {
    this.games.set(gameCode, initialState);
  }

  joinGame(gameCode: string, playerId: string): boolean {
    const game = this.games.get(gameCode);
    if (!game || game.players.length >= 2) return false;

    game.players.push(playerId);
    this.playerToGame.set(playerId, gameCode);
    return true;
  }

  getGame(gameCode: string): GameState | undefined {
    return this.games.get(gameCode);
  }

  updateGame(gameCode: string, gameState: Partial<GameState>): void {
    const game = this.games.get(gameCode);
    if (game) {
      this.games.set(gameCode, { ...game, ...gameState });
    }
  }

  removeGame(gameCode: string): void {
    const game = this.games.get(gameCode);
    if (game) {
      game.players.forEach((playerId) => {
        this.playerToGame.delete(playerId);
      });
      this.games.delete(gameCode);
    }
  }

  getPlayerGame(playerId: string): GameState | undefined {
    const gameCode = this.playerToGame.get(playerId);
    if (gameCode) {
      return this.games.get(gameCode);
    }
    return undefined;
  }
}

export const gameManager = new GameManager();

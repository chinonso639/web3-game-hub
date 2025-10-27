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
  playerWallets: string[];
  currentRound: number;
  rounds: any[];
  status: string;
  winner?: string;
  winnerUsername?: string;
}

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map();

  createGame(
    gameCode: string,
    playerId: string,
    username: string,
    walletAddress: string
  ): GameState {
    console.log(
      `[GameManager] createGame called with gameCode=${gameCode}, playerId=${playerId}, username=${username}`
    );
    const gameState: GameState = {
      gameCode,
      players: [playerId],
      playerUsernames: [username],
      playerWallets: [walletAddress],
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
    username: string,
    walletAddress: string
  ): GameState | null {
    console.log(
      `[GameManager] joinGame called with gameCode=${gameCode}, playerId=${playerId}, username=${username}`
    );
    const game = this.games.get(gameCode);
    if (!game || game.players.length >= 2) return null;

    game.players.push(playerId);
    game.playerUsernames.push(username);
    game.playerWallets.push(walletAddress);
    game.status = "active";
    this.playerToGame.set(playerId, gameCode);
    console.log(`[GameManager] Player joined:`, game);

    return game;
  }

  reconnectPlayer(
    gameCode: string,
    walletAddress: string,
    newSocketId: string
  ): GameState | null {
    const game = this.games.get(gameCode);
    if (!game) return null;
    const idx = game.playerWallets.findIndex((w) => w === walletAddress);
    if (idx === -1) return null;
    const oldSocketId = game.players[idx];
    // Update socket id for this player
    game.players[idx] = newSocketId;
    // Update reverse mapping
    this.playerToGame.delete(oldSocketId);
    this.playerToGame.set(newSocketId, gameCode);
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
      // Do not delete the in-memory game when a player disconnects.
      // Keeping the game allows the second player to join even if the creator is offline.
      // We only clear the reverse lookup so a new socket.id can map on reconnection.
      this.playerToGame.delete(playerId);
    }
  }
}

export const gameManager = new GameManager();

"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useAccount } from "wagmi";

interface GameState {
  gameCode: string;
  players: string[];
  playerUsernames: string[];
  currentRound: number;
  rounds: any[];
  status: string;
  winner?: string;
  winnerUsername?: string;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { address } = useAccount();

  useEffect(() => {
    if (!socket) return;

    socket.on("game-created", (data) => {
      setGameState(data.gameState);
      setIsLoading(false);
    });

    socket.on("player-joined", (gameState) => {
      setGameState(gameState);
    });

    socket.on("game-start", (gameState) => {
      setGameState(gameState);
    });

    socket.on("guess-received", (data) => {
      setGameState(data.gameState);
    });

    socket.on("round-complete", (data) => {
      setGameState(data.gameState);
    });

    socket.on("next-round", (gameState) => {
      setGameState(gameState);
    });

    socket.on("error", (message) => {
      setError(message);
      setIsLoading(false);
    });

    return () => {
      socket.off("game-created");
      socket.off("player-joined");
      socket.off("game-start");
      socket.off("guess-received");
      socket.off("round-complete");
      socket.off("next-round");
      socket.off("error");
    };
  }, [socket]);

  const createGame = () => {
    if (!socket || !address) return;

    setIsLoading(true);
    setError(null);
    socket.emit("create-game", { walletAddress: address });
  };

  const joinGame = (gameCode: string) => {
    if (!socket || !address) return;

    setIsLoading(true);
    setError(null);
    socket.emit("join-game", { gameCode, walletAddress: address });
  };

  const makeGuess = (guess: number) => {
    if (!socket) return;

    socket.emit("make-guess", { guess });
  };

  return {
    gameState,
    isLoading,
    error,
    createGame,
    joinGame,
    makeGuess,
  };
}

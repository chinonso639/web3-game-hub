"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useChess } from "@/hooks/use-chess";
import { Chess, Square } from "chess.js";

type ChessMove = {
  from: Square;
  to: Square;
};

export function ChessBoard() {
  const [game] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const {
    isReady,
    color,
    isMyTurn,
    lastMove,
    joinGame,
    createGame,
    makeMove,
    gameCode,
  } = useChess();

  useEffect(() => {
    if (!isReady) return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get("game");
    const stored =
      typeof window !== "undefined"
        ? JSON.parse(sessionStorage.getItem("chess.state") || "{}")
        : {};
    const storedCode = stored?.gameCode as string | undefined;

    if (urlCode) {
      if (urlCode !== gameCode && urlCode !== storedCode) {
        joinGame(urlCode).catch((e) => {
          console.error("Failed to join chess game on board:", e);
        });
      }
      return;
    }

    if (gameCode || storedCode) {
      // Already have a game context; don't auto-create on refresh
      return;
    }

    createGame().catch((e) => {
      console.error("Failed to create chess game on board:", e);
    });
  }, [isReady, joinGame, createGame, gameCode]);

  useEffect(() => {
    if (color) setPlayerColor(color === "white" ? "w" : "b");
  }, [color]);

  useEffect(() => {
    if (lastMove) handleOpponentMove(lastMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove]);

  const handleOpponentMove = (move: ChessMove) => {
    try {
      game.move({ from: move.from, to: move.to });
      setBoard(game.board());
    } catch (error) {
      console.error("Invalid move:", error);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (!isMyTurn) return;

    if (selectedSquare) {
      try {
        const move = {
          from: selectedSquare,
          to: square,
        };

        // Attempt to make the move
        const result = game.move(move);
        if (result) {
          setBoard(game.board());
          // Emit the move via socket; useChess will flip turns
          makeMove(move as any);
        }
      } catch (error) {
        console.error("Invalid move:", error);
      }
      setSelectedSquare(null);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
      }
    }
  };

  const getSquareCoordinates = (index: number): Square => {
    const file = String.fromCharCode(97 + (index % 8));
    const rank = 8 - Math.floor(index / 8);
    return `${file}${rank}` as Square;
  };

  const getPieceSymbol = (
    piece: { type: string; color: string } | null
  ): string => {
    if (!piece) return "";
    const symbols: { [key: string]: { [key: string]: string } } = {
      w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
      b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
    };
    return symbols[piece.color][piece.type] || "";
  };

  return (
    <Card className="w-full max-w-[600px] mx-auto">
      <CardContent className="p-4">
        {!isReady && (
          <div className="mb-4 text-center text-red-500">
            Connecting to game server...
          </div>
        )}
        <div
          className={`grid grid-cols-8 gap-0 border border-gray-200 ${
            playerColor === "b" ? "rotate-180" : ""
          }`}
        >
          {Array(64)
            .fill(null)
            .map((_, index) => {
              const square = getSquareCoordinates(index);
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const file = index % 8;
              const rank = Math.floor(index / 8);

              return (
                <div
                  key={square}
                  className={`
                  w-full aspect-square
                  ${(file + rank) % 2 === 0 ? "bg-white" : "bg-gray-200"}
                  ${isSelected ? "bg-blue-200" : ""}
                  flex items-center justify-center
                  cursor-pointer
                  ${playerColor === "b" ? "rotate-180" : ""}
                `}
                  onClick={() => handleSquareClick(square)}
                >
                  {piece && (
                    <div
                      className={`text-2xl ${
                        piece.color === "w" ? "text-black" : "text-gray-700"
                      }`}
                    >
                      {getPieceSymbol(piece)}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        <div className="mt-4 text-center">
          {game.isGameOver()
            ? `Game Over - ${game.isCheckmate() ? "Checkmate!" : "Draw"}`
            : isMyTurn
            ? "Your turn"
            : "Opponent's turn"}
        </div>
      </CardContent>
    </Card>
  );
}

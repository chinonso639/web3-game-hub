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
  const [validTargets, setValidTargets] = useState<Set<Square>>(new Set());
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
    isFinished,
    result,
    reportGameOver,
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
      // Clear any local selection on opponent move
      setSelectedSquare(null);
      setValidTargets(new Set());
      // Check for game over after opponent move
      if (game.isGameOver()) {
        // Determine reason
        const reason = game.isCheckmate()
          ? "checkmate"
          : game.isStalemate()
          ? "stalemate"
          : game.isThreefoldRepetition()
          ? "threefold"
          : game.isInsufficientMaterial()
          ? "insufficient"
          : "draw";
        // Winner is the side that just moved if checkmate
        // Note: chess.js flip turn after move, so current turn is the loser
        const winner = game.isCheckmate()
          ? game.turn() === "w"
            ? "black"
            : "white"
          : undefined;
        // Inform hook/server to broadcast
        reportGameOver({ reason, winner });
      }
    } catch (error) {
      console.error("Invalid move:", error);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (!isMyTurn || isFinished) return;

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
          // Check for game over after my move
          if (game.isGameOver()) {
            const reason = game.isCheckmate()
              ? "checkmate"
              : game.isStalemate()
              ? "stalemate"
              : game.isThreefoldRepetition()
              ? "threefold"
              : game.isInsufficientMaterial()
              ? "insufficient"
              : "draw";
            const winner = game.isCheckmate()
              ? game.turn() === "w"
                ? "black"
                : "white"
              : undefined;
            reportGameOver({ reason, winner });
          }
        }
      } catch (error) {
        console.error("Invalid move:", error);
      }
      setSelectedSquare(null);
      setValidTargets(new Set());
    } else {
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        // Compute legal targets for visual hinting
        try {
          const moves = game.moves({ square, verbose: true }) as Array<{
            to: Square;
          }>;
          setValidTargets(new Set(moves.map((m) => m.to)));
        } catch {
          setValidTargets(new Set());
        }
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
                  ${isSelected ? "bg-blue-200 ring-2 ring-blue-500" : ""}
                  flex items-center justify-center
                  cursor-pointer
                  ${playerColor === "b" ? "rotate-180" : ""}
                  relative
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
                  {/* Highlight available targets with a subtle dot */}
                  {!isSelected && validTargets.has(square) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-blue-500/60" />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        <div className="mt-4 text-center">
          {isFinished ? (
            <span className="text-white">
              Game Over -{" "}
              {result?.reason === "checkmate"
                ? "Checkmate"
                : result?.reason === "stalemate"
                ? "Stalemate"
                : result?.reason === "threefold"
                ? "Threefold repetition"
                : result?.reason === "insufficient"
                ? "Insufficient material"
                : "Draw"}
              {result?.winner
                ? ` • Winner: ${result.winner === "white" ? "White" : "Black"}`
                : ""}
            </span>
          ) : game.isGameOver() ? (
            <span className="text-white">
              Game Over - {game.isCheckmate() ? "Checkmate" : "Draw"}
            </span>
          ) : isMyTurn ? (
            "Your turn"
          ) : (
            "Opponent's turn"
          )}
        </div>
      </CardContent>
    </Card>
  );
}

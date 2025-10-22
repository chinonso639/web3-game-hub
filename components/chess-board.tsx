import React, { useEffect, useState, useRef } from "react";
import { Chess, Square } from "chess.js";
import { useChess } from "@/hooks/use-chess";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function ChessBoard() {
  const chessRef = useRef(new Chess());
  const {
    color,
    isPlaying,
    isMyTurn,
    gameCode,
    createGame,
    joinGame,
    makeMove,
    lastMove,
  } = useChess();
  const [validMoves, setValidMoves] = useState<Square[]>([]);

  // Update chess instance when receiving opponent's move
  useEffect(() => {
    if (lastMove && !isMyTurn) {
      try {
        chessRef.current.move(lastMove);
      } catch (e) {
        console.error("Invalid move received:", e);
        toast.error("Invalid move received from opponent");
      }
    }
  }, [lastMove, isMyTurn]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [gameCodeInput, setGameCodeInput] = useState("");

  const handleSquareClick = (square: Square) => {
    console.log("Square clicked:", { square, isPlaying, isMyTurn, color });

    if (!color) {
      toast.error("No color assigned - try rejoining the game");
      return;
    }

    if (!isPlaying || !isMyTurn) {
      if (!isPlaying) {
        toast.error("Game hasn't started yet - waiting for opponent");
        console.log("Game state:", { isPlaying, isMyTurn, color });
      } else if (!isMyTurn) {
        toast.error(
          `Not your turn - waiting for ${color === "white" ? "black" : "white"}`
        );
      }
      return;
    }
    const chess = chessRef.current;

    if (selectedSquare) {
      const move = {
        from: selectedSquare,
        to: square,
      };

      try {
        // Check if move is legal
        const result = chess.move(move);
        if (result) {
          // If move is legal, send it to opponent
          makeMove(move);
          setSelectedSquare(null);
          setValidMoves([]);
          toast.success("Move made");
        } else {
          // If move is illegal, just clear selection
          setSelectedSquare(null);
          setValidMoves([]);
          toast.error("Invalid move");
        }
      } catch (e) {
        // On error (illegal move), clear selection
        console.error("Invalid move:", e);
        setSelectedSquare(null);
        setValidMoves([]);
        toast.error("Invalid move");
      }
    } else {
      const piece = chessRef.current.get(square);
      // Only allow selecting pieces of your color
      if (piece && piece.color === (color === "white" ? "w" : "b")) {
        setSelectedSquare(square);
        // Get valid moves for selected piece
        const moves = chessRef.current.moves({ square, verbose: true });
        setValidMoves(moves.map((m) => m.to as Square));
      } else {
        toast.error("Not your piece");
      }
    }
  };

  useEffect(() => {
    function handleResize() {
      const board = document.querySelector(".chess-board") as HTMLElement;
      if (board) {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 200);
        board.style.width = size + "px";
        board.style.height = size + "px";
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderSquare = (square: Square, i: number) => {
    const piece = chessRef.current.get(square);
    const isSelected = square === selectedSquare;
    const isLightSquare = (Math.floor(i / 8) + (i % 8)) % 2 === 0;
    const isValidMove = validMoves.includes(square);

    return (
      <div
        key={square}
        onClick={() => handleSquareClick(square)}
        className={`
          aspect-square relative cursor-pointer
          ${isLightSquare ? "bg-amber-100" : "bg-amber-800"}
          ${isSelected ? "ring-2 ring-blue-500" : ""}
          ${isValidMove ? "ring-2 ring-green-500" : ""}
        `}
      >
        {piece && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {getPieceSymbol(piece)}
          </div>
        )}
      </div>
    );
  };

  const squares: Square[] = [
    "a8",
    "b8",
    "c8",
    "d8",
    "e8",
    "f8",
    "g8",
    "h8",
    "a7",
    "b7",
    "c7",
    "d7",
    "e7",
    "f7",
    "g7",
    "h7",
    "a6",
    "b6",
    "c6",
    "d6",
    "e6",
    "f6",
    "g6",
    "h6",
    "a5",
    "b5",
    "c5",
    "d5",
    "e5",
    "f5",
    "g5",
    "h5",
    "a4",
    "b4",
    "c4",
    "d4",
    "e4",
    "f4",
    "g4",
    "h4",
    "a3",
    "b3",
    "c3",
    "d3",
    "e3",
    "f3",
    "g3",
    "h3",
    "a2",
    "b2",
    "c2",
    "d2",
    "e2",
    "f2",
    "g2",
    "h2",
    "a1",
    "b1",
    "c1",
    "d1",
    "e1",
    "f1",
    "g1",
    "h1",
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {!isPlaying && !gameCode && (
        <div className="flex gap-4">
          <Button onClick={createGame}>Create Game</Button>
          <div className="flex gap-2">
            <input
              type="text"
              value={gameCodeInput}
              onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
              placeholder="Game Code"
              className="px-2 py-1 border rounded"
            />
            <Button onClick={() => joinGame(gameCodeInput)}>Join Game</Button>
          </div>
        </div>
      )}

      {gameCode && !isPlaying && (
        <div className="text-center">
          <p>Game Code: {gameCode}</p>
          <p>Waiting for opponent...</p>
        </div>
      )}

      {isPlaying && (
        <div className="text-center mb-4">
          <p>You are playing as {color}</p>
          <p>{isMyTurn ? "Your turn" : "Opponent's turn"}</p>
        </div>
      )}

      <div className="chess-board grid grid-cols-8">
        {squares.map((square, i) => renderSquare(square, i))}
      </div>
    </div>
  );
}

function getPieceSymbol(piece: { type: string; color: string }) {
  const symbols: { [key: string]: { [key: string]: string } } = {
    w: {
      p: "♙",
      n: "♘",
      b: "♗",
      r: "♖",
      q: "♕",
      k: "♔",
    },
    b: {
      p: "♟",
      n: "♞",
      b: "♝",
      r: "♜",
      q: "♛",
      k: "♚",
    },
  };

  return symbols[piece.color][piece.type];
}

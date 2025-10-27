"use client";

import { ChessBoard } from "@/components/chess/chess-board";

export default function ChessPage() {
  return (
    <div className="container mx-auto p-4">
      {/* On mobile, vertically and horizontally center the board */}
      <div className="max-w-4xl mx-auto flex sm:block items-center justify-center min-h-[100svh] sm:min-h-0">
        <ChessBoard />
      </div>
    </div>
  );
}

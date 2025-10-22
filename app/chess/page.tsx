"use client";

import { ChessBoard } from "@/components/chess/chess-board";

export default function ChessPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <ChessBoard />
      </div>
    </div>
  );
}

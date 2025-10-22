"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GameType } from "@/lib/types";

type GameSelectorProps = {
  onSelect: (type: GameType) => void;
};

export function GameTypeSelector({ onSelect }: GameSelectorProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
      <CardContent className="p-6 grid gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">
            Multiplayer Games
          </p>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              onClick={() => onSelect("guessing")}
              className="flex items-center gap-2 w-full"
            >
              <span className="text-xl">🎯</span>
              Multiplayer Guessing Game
            </Button>
            <Button
              variant="secondary"
              onClick={() => onSelect("chess")}
              className="flex items-center gap-2 w-full"
            >
              <span className="text-xl">♟️</span>
              Chess
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">Practice Mode</p>
          <Button
            variant="secondary"
            onClick={() => onSelect("guessing-practice")}
            className="flex items-center gap-2 w-full"
          >
            <span className="text-xl">🤖</span>
            Practice vs AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

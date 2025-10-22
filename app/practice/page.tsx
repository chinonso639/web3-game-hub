"use client";

import React, { useState, useEffect } from "react";
import { GameBoardAI } from "@/components/game-board-ai";
import { Button } from "@/components/ui/button";

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | null
  >(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("practiceDifficulty");
      if (saved === "easy" || saved === "medium" || saved === "hard") {
        setDifficulty(saved);
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  if (!difficulty) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Practice vs AI</h2>
            <p className="text-sm text-gray-300 mb-4">
              Choose difficulty before starting:
            </p>
            <div className="flex gap-3 mb-4">
              <Button
                onClick={() => {
                  try {
                    localStorage.setItem("practiceDifficulty", "easy");
                  } catch (e) {}
                  setDifficulty("easy");
                }}
                className="w-full"
              >
                Easy
              </Button>
              <Button
                onClick={() => {
                  try {
                    localStorage.setItem("practiceDifficulty", "medium");
                  } catch (e) {}
                  setDifficulty("medium");
                }}
                className="w-full"
              >
                Medium
              </Button>
              <Button
                onClick={() => {
                  try {
                    localStorage.setItem("practiceDifficulty", "hard");
                  } catch (e) {}
                  setDifficulty("hard");
                }}
                className="w-full"
              >
                Hard
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Easy: slower/less likely AI. Hard: fast and aggressive AI.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                localStorage.removeItem("practiceDifficulty");
              } catch (e) {}
              setDifficulty(null);
            }}
          >
            Change difficulty
          </Button>
        </div>

        <GameBoardAI difficulty={difficulty} />
      </div>
    </main>
  );
}

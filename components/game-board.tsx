"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame } from "@/hooks/use-game";
import { useSocket } from "@/providers/socket-provider";
import { Trophy, Target, Users, Clock } from "lucide-react";

export function GameBoard() {
  const { gameState, makeGuess } = useGame();
  const { socket } = useSocket();
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundResult, setRoundResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("round-complete", (data) => {
      setRoundResult(data.roundData);
      setShowResult(true);
      setHasGuessed(false);

      setTimeout(() => {
        setShowResult(false);
        setRoundResult(null);
        setSelectedGuess(null);
      }, 3000);
    });

    socket.on("next-round", () => {
      setHasGuessed(false);
      setSelectedGuess(null);
    });

    return () => {
      socket.off("round-complete");
      socket.off("next-round");
    };
  }, [socket]);

  if (!gameState) return null;

  const handleGuess = (guess: number) => {
    setSelectedGuess(guess);
    setHasGuessed(true);
    makeGuess(guess);
  };

  const currentRound = gameState.currentRound;
  const maxRounds = 5;
  const isGameComplete = gameState.status === "completed";

  if (isGameComplete) {
    return (
      <Card className="bg-slate-800 border-slate-700 max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-3xl font-bold mb-4">
            {gameState.winner ? (
              <div>
                <div className="text-yellow-400">🏆 Winner!</div>
                <div className="text-xl text-green-400 mt-2">
                  {gameState.winnerUsername ||
                    `Player ${
                      gameState.players.indexOf(gameState.winner!) + 1
                    }`}{" "}
                  Wins!
                </div>
              </div>
            ) : (
              <div className="text-blue-400">🤝 It's a Draw!</div>
            )}
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-gray-300">Final Score:</p>
            <div className="flex justify-center gap-8 mt-2">
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {gameState.rounds.filter((r) => r.winner === 0).length}
                </div>
                <div className="text-sm text-gray-400">
                  {gameState.playerUsernames?.[0] || "Player 1"}
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">
                  {gameState.rounds.filter((r) => r.winner === 1).length}
                </div>
                <div className="text-sm text-gray-400">
                  {gameState.playerUsernames?.[1] || "Player 2"}
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700"
          >
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Round {currentRound} of {maxRounds}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: maxRounds }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < currentRound - 1
                    ? "bg-green-500"
                    : i === currentRound - 1
                    ? "bg-blue-500"
                    : "bg-slate-600"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">
                {gameState.players.length}/2 Players
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">1 USDT Stake</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round Result Display */}
      {showResult && roundResult && (
        <Card className="bg-slate-800 border-slate-700 animate-pulse">
          <CardContent className="p-6 text-center">
            <div className="text-lg font-bold text-white mb-2">
              Round Result
            </div>
            <div className="text-3xl font-mono text-yellow-400 mb-2">
              Correct Answer: {roundResult.correctAnswer}
            </div>
            <div className="text-green-400 text-lg font-semibold">
              {roundResult.winner !== null
                ? `🎉 ${
                    gameState.playerUsernames?.[roundResult.winner] ||
                    `Player ${roundResult.winner + 1}`
                  } wins this round!`
                : "Draw this round!"}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {gameState.playerUsernames?.[0] || "Player 1"} guessed:{" "}
              {roundResult.player1Guess} |{" "}
              {gameState.playerUsernames?.[1] || "Player 2"} guessed:{" "}
              {roundResult.player2Guess}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guess Interface */}
      {!showResult && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Make Your Guess</CardTitle>
            <p className="text-gray-400">Choose 0 or 1</p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4 mb-6">
              <Button
                size="lg"
                onClick={() => handleGuess(0)}
                disabled={hasGuessed}
                className={`w-24 h-24 text-2xl font-bold ${
                  selectedGuess === 0
                    ? "bg-blue-600 border-blue-400 border-2"
                    : "bg-slate-700 hover:bg-slate-600"
                } ${hasGuessed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                0
              </Button>
              <Button
                size="lg"
                onClick={() => handleGuess(1)}
                disabled={hasGuessed}
                className={`w-24 h-24 text-2xl font-bold ${
                  selectedGuess === 1
                    ? "bg-purple-600 border-purple-400 border-2"
                    : "bg-slate-700 hover:bg-slate-600"
                } ${hasGuessed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                1
              </Button>
            </div>

            {hasGuessed && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                  <span className="text-green-400">
                    Waiting for opponent...
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score Display */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="text-center text-gray-300 mb-2">Current Score</div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {gameState.rounds.filter((r) => r.winner === 0).length}
              </div>
              <div className="text-sm text-gray-400">
                {gameState.playerUsernames?.[0] || "Player 1"}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-600">-</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {gameState.rounds.filter((r) => r.winner === 1).length}
              </div>
              <div className="text-sm text-gray-400">
                {gameState.playerUsernames?.[1] || "Player 2"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

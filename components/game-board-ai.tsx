"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Users, Clock } from "lucide-react";

type Round = {
  player1Guess?: number | -1;
  player2Guess?: number | -1;
  correctAnswer?: number;
  winner?: number | null; // 0,1 or null for draw
  timeoutReason?: "both" | "player1" | "player2" | null;
};

export function GameBoardAI({
  difficulty = "medium",
}: {
  difficulty?: "easy" | "medium" | "hard";
}) {
  const maxRounds = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [hasGuessed, setHasGuessed] = useState(false); // human guessed
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<Round | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"playing" | "completed">("playing");
  const [aiThinking, setAiThinking] = useState(false);

  // Start/reset round
  const startRound = (roundNum = currentRound) => {
    setTimeLeft(30);
    setTimerActive(true);
    setHasGuessed(false);
    setSelectedGuess(null);
    setRoundResult(null);
    setShowResult(false);
    // schedule AI guess (random behavior)
    scheduleAIGuess();
  };

  useEffect(() => {
    startRound(currentRound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound]);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft === 0) {
      setTimerActive(false);
      resolveRoundByTimeout();
      return;
    }
    const i = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);

  // AI behavior: schedule a guess at a random time; sometimes AI may also timeout
  const aiTimeoutRef = React.useRef<any>(null);
  const scheduleAIGuess = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    // Difficulty controls AI responsiveness and likelihood to guess.
    let willGuess = true;
    let min = 500;
    let max = 4500;

    if (difficulty === "easy") {
      willGuess = Math.random() < 0.6; // 60% chance to guess
      min = 1500;
      max = 4500;
    } else if (difficulty === "medium") {
      willGuess = Math.random() < 0.85; // 85% chance to guess
      min = 800;
      max = 3500;
    } else if (difficulty === "hard") {
      willGuess = Math.random() < 0.98; // 98% chance to guess
      min = 300;
      max = 1500;
    }

    if (!willGuess) {
      setAiThinking(false);
      return;
    }

    setAiThinking(true);
    const delay = min + Math.floor(Math.random() * (max - min + 1));
    aiTimeoutRef.current = setTimeout(() => {
      aiMakeGuess();
    }, delay);
  };

  const aiMakeGuess = () => {
    // Update the rounds state and, if both guesses are present, resolve the
    // round inside the same updater to avoid stale-closure checks.
    setRounds((prev) => {
      const r = [...prev];
      const idx = currentRound - 1;
      r[idx] = r[idx] || {};
      // AI chooses 0 or 1 randomly
      if (r[idx].player2Guess === undefined) {
        r[idx].player2Guess = Math.random() > 0.5 ? 1 : 0;
      }

      const round = r[idx];
      // If both guesses now present and the round hasn't been resolved yet,
      // compute result immediately.
      if (
        round.player1Guess !== undefined &&
        round.player2Guess !== undefined &&
        round.correctAnswer === undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        const p1Win = round.player1Guess === correct;
        const p2Win = round.player2Guess === correct;
        round.winner = p1Win && !p2Win ? 0 : p2Win && !p1Win ? 1 : null;
        round.timeoutReason = null;

        // stop the timer and clear any pending AI timeout
        setTimerActive(false);
        if (aiTimeoutRef.current) {
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
        }
        setAiThinking(false);

        // show result
        setRoundResult(round);
        setShowResult(true);
        setTimeout(() => {
          setShowResult(false);
          setRoundResult(null);
          if (currentRound >= maxRounds) {
            finishGame(r);
          } else {
            setCurrentRound((c) => c + 1);
          }
        }, 2500);
      }

      return r;
    });
  };

  // cleanup AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  const makeGuess = (guess: number) => {
    setSelectedGuess(guess);
    setHasGuessed(true);
    // Update rounds and attempt to resolve immediately if AI has already guessed.
    setRounds((prev) => {
      const r = [...prev];
      const idx = currentRound - 1;
      r[idx] = r[idx] || {};
      r[idx].player1Guess = guess;

      const round = r[idx];
      if (
        round.player1Guess !== undefined &&
        round.player2Guess !== undefined &&
        round.correctAnswer === undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        const p1Win = round.player1Guess === correct;
        const p2Win = round.player2Guess === correct;
        round.winner = p1Win && !p2Win ? 0 : p2Win && !p1Win ? 1 : null;
        round.timeoutReason = null;

        // stop the timer and clear pending AI timeout to avoid races
        setTimerActive(false);
        if (aiTimeoutRef.current) {
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
        }

        setRoundResult(round);
        setShowResult(true);
        setTimeout(() => {
          setShowResult(false);
          setRoundResult(null);
          if (currentRound >= maxRounds) {
            finishGame(r);
          } else {
            setCurrentRound((c) => c + 1);
          }
        }, 2500);
      }

      return r;
    });
  };

  const resolveRoundByTimeout = () => {
    // fallback when time runs out
    setRounds((prev) => {
      const r = [...prev];
      const idx = currentRound - 1;
      r[idx] = r[idx] || {};
      const round = r[idx];
      let roundJustCompleted = false;

      if (
        round.player1Guess === undefined &&
        round.player2Guess === undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        round.player1Guess = -1;
        round.player2Guess = -1;
        round.winner = null;
        round.timeoutReason = "both";
        roundJustCompleted = true;
      } else if (
        round.player1Guess === undefined &&
        round.player2Guess !== undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        round.player1Guess = -1;
        round.winner = round.player2Guess === correct ? 1 : 0;
        round.timeoutReason = "player1";
        roundJustCompleted = true;
      } else if (
        round.player2Guess === undefined &&
        round.player1Guess !== undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        round.player2Guess = -1;
        round.winner = round.player1Guess === correct ? 0 : 1;
        round.timeoutReason = "player2";
        roundJustCompleted = true;
      }

      r[idx] = round;

      if (roundJustCompleted) {
        // stop timer and clear AI timeout
        setTimerActive(false);
        if (aiTimeoutRef.current) {
          clearTimeout(aiTimeoutRef.current);
          aiTimeoutRef.current = null;
        }
        setAiThinking(false);

        // show result
        setRoundResult(round);
        setShowResult(true);
        // move to next after pause
        setTimeout(() => {
          setShowResult(false);
          setRoundResult(null);
          if (currentRound >= maxRounds) {
            finishGame(r);
          } else {
            setCurrentRound((c) => c + 1);
          }
        }, 2500);
      }

      return r;
    });
  };

  const resolveRound = () => {
    setRounds((prev) => {
      const r = [...prev];
      const idx = currentRound - 1;
      r[idx] = r[idx] || {};
      const round = r[idx];

      // If both guesses present, compute correct answer and winner
      if (
        round.player1Guess !== undefined &&
        round.player2Guess !== undefined
      ) {
        const correct = Math.floor(Math.random() * 2);
        round.correctAnswer = correct;
        const p1Win = round.player1Guess === correct;
        const p2Win = round.player2Guess === correct;
        round.winner = p1Win && !p2Win ? 0 : p2Win && !p1Win ? 1 : null;
        round.timeoutReason = null;

        r[idx] = round;

        // show result
        setRoundResult(round);
        setShowResult(true);
        setAiThinking(false);
        setTimeout(() => {
          setShowResult(false);
          setRoundResult(null);
          if (currentRound >= maxRounds) {
            finishGame(r);
          } else {
            setCurrentRound((c) => c + 1);
          }
        }, 2500);
      }

      return r;
    });
  };

  const finishGame = (finalRounds: Round[]) => {
    // compute winner
    const p1 = finalRounds.filter((x) => x.winner === 0).length;
    const p2 = finalRounds.filter((x) => x.winner === 1).length;
    setStatus("completed");
    // set a final round result to show in UI if needed
  };

  // UI helpers
  const p1Score = rounds.filter((r) => r.winner === 0).length;
  const p2Score = rounds.filter((r) => r.winner === 1).length;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full flex justify-center mt-8 mb-2 px-2">
        <Card className="bg-slate-900/80 border-none shadow-xl backdrop-blur-lg rounded-2xl w-full max-w-md animate-fade-in">
          <CardHeader className="py-2 px-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
                <Target className="w-5 h-5 text-green-400" />
                {status === "completed"
                  ? `Game Complete!`
                  : `Round ${currentRound} of ${maxRounds}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-300 px-2 py-1 rounded-md bg-slate-800/60">
                  {difficulty?.toUpperCase()}
                </div>
                {aiThinking && (
                  <div className="text-xs text-blue-300 px-2 py-1 rounded-md bg-blue-900/40">
                    AI thinking...
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-2">
            <div className="flex justify-center gap-2 mb-2">
              {Array.from({ length: maxRounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${
                    i < rounds.length
                      ? "bg-green-500"
                      : i === rounds.length && status !== "completed"
                      ? "bg-blue-500"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">You vs AI</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  Practice vs AI • 1 USDT Stake
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Round result */}
      {showResult && roundResult && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl animate-fade-in rounded-2xl mx-auto w-full max-w-md">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-lg font-bold text-white mb-2">
              Round Result
            </div>
            <div className="text-2xl md:text-3xl font-mono text-yellow-400 mb-2">
              Correct Answer: {roundResult.correctAnswer}
            </div>
            <div className="text-green-400 text-base md:text-lg font-semibold">
              {roundResult.timeoutReason === "both"
                ? "⏰ Both players timed out! Draw this round!"
                : roundResult.winner !== null
                ? `🎉 ${
                    roundResult.winner === 0 ? "You" : "AI"
                  } wins this round!`
                : "Draw this round!"}
            </div>
            <div className="mt-2 text-xs md:text-sm text-gray-400">
              You guessed: {roundResult.player1Guess} | AI guessed:{" "}
              {roundResult.player2Guess}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guess interface */}
      {!showResult && status !== "completed" && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl rounded-2xl mx-auto w-full max-w-md animate-fade-in">
          <CardHeader className="text-center py-3 px-2">
            <CardTitle className="text-white text-lg md:text-xl">
              Make Your Guess
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <p className="text-gray-400 text-xs md:text-sm">Choose 0 or 1</p>
            </div>
            {timerActive && !hasGuessed && (
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/70 shadow-lg animate-pop-in">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="font-mono text-2xl md:text-3xl font-bold text-blue-400">
                    {timeLeft}s
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex justify-center gap-4 mb-4 md:mb-6">
              <Button
                size="lg"
                onClick={() => makeGuess(0)}
                disabled={hasGuessed}
                className={`w-16 h-16 md:w-24 md:h-24 text-2xl md:text-3xl font-bold rounded-full shadow-lg transition-all duration-200 ${
                  selectedGuess === 0
                    ? "bg-blue-600 border-blue-400 border-2 scale-105"
                    : "bg-slate-700 hover:bg-slate-600"
                } ${hasGuessed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                0
              </Button>
              <Button
                size="lg"
                onClick={() => makeGuess(1)}
                disabled={hasGuessed}
                className={`w-16 h-16 md:w-24 md:h-24 text-2xl md:text-3xl font-bold rounded-full shadow-lg transition-all duration-200 ${
                  selectedGuess === 1
                    ? "bg-purple-600 border-purple-400 border-2 scale-105"
                    : "bg-slate-700 hover:bg-slate-600"
                } ${hasGuessed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                1
              </Button>
            </div>

            {hasGuessed && (
              <div className="text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-2 shadow-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400" />
                  <span className="text-green-400">Waiting for AI...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Final result */}
      {status === "completed" && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl animate-fade-in rounded-2xl mx-auto w-full max-w-md">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-lg font-bold text-white mb-2">Game Over!</div>
            <div className="text-2xl md:text-3xl font-mono text-yellow-400 mb-2">
              Final Score
            </div>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-blue-400">
                  {p1Score}
                </div>
                <div className="text-sm md:text-base text-gray-400">You</div>
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-gray-600 flex items-center justify-center">
                -
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-blue-400">
                  {p2Score}
                </div>
                <div className="text-sm md:text-base text-gray-400">AI</div>
              </div>
            </div>
            <div className="text-lg font-bold text-green-400 mb-2">
              {p1Score > p2Score
                ? "You Win!"
                : p2Score > p1Score
                ? "AI Wins!"
                : "It's a Draw!"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score display */}
      <div className="w-full flex justify-center mt-2 mb-2 px-2">
        <Card className="bg-slate-900/80 border-none shadow-xl backdrop-blur-lg rounded-2xl w-full max-w-md animate-fade-in">
          <CardContent className="p-3 md:p-4">
            <div className="text-center text-gray-300 mb-2 text-base md:text-lg">
              Current Score
            </div>
            <div className="flex justify-center gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400 animate-pop-in">
                  {p1Score}
                </div>
                <div className="text-xs md:text-sm text-gray-400">You</div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-600 flex items-center justify-center">
                -
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400 animate-pop-in">
                  {p2Score}
                </div>
                <div className="text-xs md:text-sm text-gray-400">AI</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

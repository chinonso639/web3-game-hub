"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame } from "@/hooks/use-game";
import { useSocket } from "@/providers/socket-provider";
import { Trophy, Target, Users, Clock } from "lucide-react";
import React from "react";
//v1
export function GameBoard() {
  // Generate star positions/properties once per render
  const stars = React.useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 2 + 1}px`,
        height: `${Math.random() * 2 + 1}px`,
        opacity: Math.random() * 0.7 + 0.3,
        animation: `starTwinkle${i % 10} 3s linear infinite`,
        key: i,
      })),
    []
  );

  const shapes = React.useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        top: `${Math.random() * 90 + 5}%`,
        left: `${Math.random() * 90 + 5}%`,
        width: `${Math.random() * 18 + 10}px`,
        height: `${Math.random() * 18 + 10}px`,
        animation: `float${i % 10} 8s ease-in-out infinite`,
        colorClass:
          i % 3 === 0
            ? "bg-blue-400/30"
            : i % 3 === 1
            ? "bg-cyan-300/30"
            : "bg-yellow-300/20",
        key: i,
      })),
    []
  );
  const { gameState, makeGuess, startRoundTimer } = useGame();
  const { socket } = useSocket();
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundResult, setRoundResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const maxRounds = 5;
  const roundsPlayed = (gameState?.rounds ?? []).length;
  const currentRound = gameState?.currentRound ?? roundsPlayed + 1;
  const isGameComplete = gameState?.status === "completed";
  const handleGuess = (guess: number) => {
    setSelectedGuess(guess);
    setHasGuessed(true);
    makeGuess(guess);
  };

  // Start and reset timer for each round
  useEffect(() => {
    if (!showResult && !isGameComplete) {
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [showResult, isGameComplete, currentRound]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || hasGuessed) return;
    if (timeLeft === 0) {
      setTimerActive(false);
      setHasGuessed(true);
      // Optionally, you can trigger a timeout guess here
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, hasGuessed]);

  useEffect(() => {
    if (!socket) return;

    const onRoundComplete = (data: any) => {
      // prefer authoritative state from payload when provided
      const latestState = data?.gameState ?? gameState;
      const roundsCount = (latestState?.rounds ?? []).length;
      if (latestState?.status === "completed" || roundsCount >= maxRounds)
        return;
      setRoundResult(data?.roundData ?? null);
      setShowResult(true);
    };

    const onNextRound = (payload: any) => {
      const latestState = payload?.gameState ?? gameState;
      const roundsCount = (latestState?.rounds ?? []).length;
      if (latestState?.status === "completed" || roundsCount >= maxRounds)
        return;
      setHasGuessed(false);
      setSelectedGuess(null);
      setTimeLeft(30);
      setTimerActive(true);
      if (latestState?.gameCode) {
        startRoundTimer(latestState.gameCode);
      }
    };

    socket.on("round-complete", onRoundComplete);
    socket.on("next-round", onNextRound);

    return () => {
      socket.off("round-complete", onRoundComplete);
      socket.off("next-round", onNextRound);
    };
  }, [socket, gameState, startRoundTimer, maxRounds]);

  // Automatically proceed to next round after showing result
  useEffect(() => {
    if (showResult && !isGameComplete) {
      const timer = setTimeout(() => {
        setShowResult(false);
        setSelectedGuess(null);
        setHasGuessed(false);
        setRoundResult(null);
        if (gameState?.gameCode) {
          startRoundTimer(gameState.gameCode);
        }
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [showResult, isGameComplete, startRoundTimer, gameState?.gameCode]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Fullscreen animated gradient and star/space background */}
      <div className="fixed inset-0 w-screen h-screen -z-10 bg-gradient-to-br from-[#0f2027] via-[#00c3ff] to-[#1a2980]">
        {/* Starfield animation */}
        <div className="absolute inset-0 pointer-events-none">
          {stars.map((star) => (
            <div
              key={star.key}
              className="absolute rounded-full bg-white"
              style={{
                top: star.top,
                left: star.left,
                width: star.width,
                height: star.height,
                opacity: star.opacity,
                animation: star.animation,
              }}
            />
          ))}
        </div>
        {/* Moving nebula/waves */}
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#00c3ff"
            fillOpacity="0.25"
            d="M0,160L60,165.3C120,171,240,181,360,186.7C480,192,600,192,720,186.7C840,181,960,171,1080,154.7C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
          <path
            fill="#ffd700"
            fillOpacity="0.12"
            d="M0,224L60,218.7C120,213,240,203,360,197.3C480,192,600,192,720,186.7C840,181,960,171,1080,154.7C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
        {/* Floating neon blue/cyan/gold shapes */}
        <div className="absolute inset-0 pointer-events-none">
          {shapes.map((shape) => (
            <div
              key={shape.key}
              className={`absolute rounded-full blur-lg ${shape.colorClass}`}
              style={{
                top: shape.top,
                left: shape.left,
                width: shape.width,
                height: shape.height,
                animation: shape.animation,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes float0 { 0%{transform:translateY(0);} 50%{transform:translateY(-20px);} 100%{transform:translateY(0);} }
          @keyframes float1 { 0%{transform:translateY(0);} 50%{transform:translateY(-30px);} 100%{transform:translateY(0);} }
          @keyframes float2 { 0%{transform:translateY(0);} 50%{transform:translateY(-15px);} 100%{transform:translateY(0);} }
          @keyframes float3 { 0%{transform:translateY(0);} 50%{transform:translateY(-25px);} 100%{transform:translateY(0);} }
          @keyframes float4 { 0%{transform:translateY(0);} 50%{transform:translateY(-10px);} 100%{transform:translateY(0);} }
          @keyframes float5 { 0%{transform:translateY(0);} 50%{transform:translateY(-18px);} 100%{transform:translateY(0);} }
          @keyframes float6 { 0%{transform:translateY(0);} 50%{transform:translateY(-22px);} 100%{transform:translateY(0);} }
          @keyframes float7 { 0%{transform:translateY(0);} 50%{transform:translateY(-12px);} 100%{transform:translateY(0);} }
          @keyframes float8 { 0%{transform:translateY(0);} 50%{transform:translateY(-28px);} 100%{transform:translateY(0);} }
          @keyframes float9 { 0%{transform:translateY(0);} 50%{transform:translateY(-16px);} 100%{transform:translateY(0);} }
          @keyframes starTwinkle0 { 0%,100%{opacity:0.7;} 50%{opacity:0.3;} }
          @keyframes starTwinkle1 { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
          @keyframes starTwinkle2 { 0%,100%{opacity:0.8;} 50%{opacity:0.2;} }
          @keyframes starTwinkle3 { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
          @keyframes starTwinkle4 { 0%,100%{opacity:0.9;} 50%{opacity:0.4;} }
          @keyframes starTwinkle5 { 0%,100%{opacity:0.4;} 50%{opacity:0.8;} }
          @keyframes starTwinkle6 { 0%,100%{opacity:0.7;} 50%{opacity:0.1;} }
          @keyframes starTwinkle7 { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
          @keyframes starTwinkle8 { 0%,100%{opacity:0.5;} 50%{opacity:0.9;} }
          @keyframes starTwinkle9 { 0%,100%{opacity:0.8;} 50%{opacity:0.2;} }
        `}</style>
      </div>
      {/* Game Status - compact, floating, mobile-friendly */}
      <div className="w-full flex justify-center mt-8 mb-2 px-2">
        <Card className="bg-slate-900/80 border-none shadow-xl backdrop-blur-lg rounded-2xl w-full max-w-md animate-fade-in">
          <CardHeader className="py-2 px-2">
            <CardTitle className="text-white flex items-center justify-center gap-2 text-lg md:text-xl">
              <Target className="w-5 h-5 text-green-400" />
              {isGameComplete
                ? `Game Complete!`
                : `Round ${currentRound} of ${maxRounds}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-2">
            <div className="flex justify-center gap-2 mb-2">
              {Array.from({ length: maxRounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${
                    i < roundsPlayed
                      ? "bg-green-500"
                      : i === roundsPlayed && !isGameComplete
                      ? "bg-blue-500"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {gameState?.players?.length ?? 0}/2 Players
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">1 USDT Stake</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Round Result Display - animated, mobile-friendly */}
      {showResult && roundResult && !isGameComplete && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl animate-fade-in rounded-2xl mx-auto w-full max-w-md">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-lg font-bold text-white mb-2 animate-slide-in">
              Round Result
            </div>
            <div className="text-2xl md:text-3xl font-mono text-yellow-400 mb-2 animate-pop-in">
              Correct Answer: {roundResult.correctAnswer}
            </div>
            <div className="text-green-400 text-base md:text-lg font-semibold animate-pop-in">
              {roundResult.timeoutReason === "both"
                ? "⏰ Both players timed out! Draw this round!"
                : roundResult.winner !== null
                ? `🎉 ${
                    gameState?.playerUsernames?.[roundResult.winner] ||
                    `Player ${roundResult.winner + 1}`
                  } wins this round!`
                : "Draw this round!"}
            </div>
            <div className="mt-2 text-xs md:text-sm text-gray-400 animate-fade-in">
              {gameState?.playerUsernames?.[0] || "Player 1"} guessed:{" "}
              {roundResult.player1Guess} |{" "}
              {gameState?.playerUsernames?.[1] || "Player 2"} guessed:{" "}
              {roundResult.player2Guess}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guess Interface - mobile-friendly, gamified */}
      {!showResult && !isGameComplete && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl rounded-2xl mx-auto w-full max-w-md animate-fade-in">
          <CardHeader className="text-center py-3 px-2">
            <CardTitle className="text-white text-lg md:text-xl animate-slide-in">
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
                onClick={() => handleGuess(0)}
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
                onClick={() => handleGuess(1)}
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

      {isGameComplete && (
        <Card className="bg-gradient-to-br from-[#232526] to-[#414345] border-none shadow-2xl animate-fade-in rounded-2xl mx-auto w-full max-w-md">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-lg font-bold text-white mb-2 animate-slide-in">
              Game Over!
            </div>
            <div className="text-2xl md:text-3xl font-mono text-yellow-400 mb-2 animate-pop-in">
              Final Score
            </div>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-blue-400">
                  {
                    (gameState?.rounds ?? []).filter((r) => r.winner === 0)
                      .length
                  }
                </div>
                <div className="text-sm md:text-base text-gray-400">
                  {gameState?.playerUsernames?.[0] || "Player 1"}
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-gray-600 flex items-center justify-center">
                -
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-blue-400">
                  {
                    (gameState?.rounds ?? []).filter((r) => r.winner === 1)
                      .length
                  }
                </div>
                <div className="text-sm md:text-base text-gray-400">
                  {gameState?.playerUsernames?.[1] || "Player 2"}
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-green-400 mb-2">
              {(() => {
                const p1 = (gameState?.rounds ?? []).filter(
                  (r) => r.winner === 0
                ).length;
                const p2 = (gameState?.rounds ?? []).filter(
                  (r) => r.winner === 1
                ).length;
                if (p1 > p2)
                  return `${
                    gameState?.playerUsernames?.[0] || "Player 1"
                  } Wins!`;
                if (p2 > p1)
                  return `${
                    gameState?.playerUsernames?.[1] || "Player 2"
                  } Wins!`;
                return "It's a Draw!";
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Display - glassmorphism, mobile-friendly */}
      <div className="w-full flex justify-center mt-2 mb-2 px-2">
        <Card className="bg-slate-900/80 border-none shadow-xl backdrop-blur-lg rounded-2xl w-full max-w-md animate-fade-in">
          <CardContent className="p-3 md:p-4">
            <div className="text-center text-gray-300 mb-2 text-base md:text-lg">
              Current Score
            </div>
            <div className="flex justify-center gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400 animate-pop-in">
                  {
                    (gameState?.rounds ?? []).filter((r) => r.winner === 0)
                      .length
                  }
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {gameState?.playerUsernames?.[0] || "Player 1"}
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-600 flex items-center justify-center">
                -
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400 animate-pop-in">
                  {
                    (gameState?.rounds ?? []).filter((r) => r.winner === 1)
                      .length
                  }
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {gameState?.playerUsernames?.[1] || "Player 2"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

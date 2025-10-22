"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from "@/hooks/use-game";
import { useChess } from "@/hooks/use-chess";
import { useRouter } from "next/navigation";
import { Dice1, Users, Copy, Crown } from "lucide-react";
import { toast } from "sonner";

function ChessTabContent() {
  const [chessJoinCode, setChessJoinCode] = useState("");
  const chess = useChess();
  const router = useRouter();

  // Auto-navigate creator to the chess board when the second player joins and game starts
  const autoNavDone = useRef(false);
  useEffect(() => {
    if (autoNavDone.current) return;
    if (chess.isPlaying && chess.gameCode) {
      autoNavDone.current = true;
      router.push(`/chess?game=${chess.gameCode}`);
    }
  }, [chess.isPlaying, chess.gameCode, router]);

  const copyChessCode = () => {
    if (chess.gameCode) {
      navigator.clipboard.writeText(chess.gameCode);
      toast.success("Chess game code copied to clipboard!");
    }
  };

  if (chess.gameCode && !chess.isPlaying) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Waiting for Chess Opponent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              Share this code with your opponent:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-slate-700 text-blue-400 px-4 py-2 rounded-lg text-lg font-mono">
                {chess.gameCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyChessCode}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await chess.leaveGame();
                  toast.message("Left chess game");
                }}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                Leave
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
          </div>
          <p className="text-center text-gray-400 text-sm">
            Game starts when the second player joins
          </p>
          <div className="text-center">
            <Link
              href={`/chess?game=${chess.gameCode}`}
              prefetch={false}
              className="underline text-blue-400"
            >
              Open chess board
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-purple-400" />
          Chess Battle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={async () => {
            try {
              const code = await chess.createGame();
              toast.success(`Chess game created: ${code}`);
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : "Failed to create chess game";
              toast.error(msg);
            }
          }}
          disabled={Boolean(chess.gameCode)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
        >
          {chess.gameCode ? "Game Created" : "Create Chess Game"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-2 text-gray-400">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Enter chess code..."
            value={chessJoinCode}
            onChange={(e) => setChessJoinCode(e.target.value.toUpperCase())}
            className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                if (!chessJoinCode) return;
                // Navigate to the chess board and let it perform the join
                router.push(`/chess?game=${chessJoinCode}`);
              }}
              disabled={!chessJoinCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Join Chess Game
            </Button>
            {chess.gameCode && (
              <Link
                href={`/chess?game=${chess.gameCode}`}
                prefetch={false}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-gray-200"
                >
                  Open Board
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GameLobby() {
  const [joinCode, setJoinCode] = useState("");
  const { gameState, isLoading, error, createGame, joinGame } = useGame();

  const copyGameCode = () => {
    if (gameState?.gameCode) {
      navigator.clipboard.writeText(gameState.gameCode);
      toast.success("Game code copied to clipboard!");
    }
  };

  if (gameState) {
    if (gameState.status === "waiting") {
      return (
        <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Waiting for Player
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                Share this code with your opponent:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-slate-700 text-blue-400 px-4 py-2 rounded-lg text-lg font-mono">
                  {gameState.gameCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyGameCode}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
            <p className="text-center text-gray-400 text-sm">
              Game will start automatically when second player joins
            </p>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Tabs defaultValue="binary" className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-2 bg-slate-800">
        <TabsTrigger value="binary" className="text-white">
          Binary
        </TabsTrigger>
        <TabsTrigger value="chess" className="text-white">
          Chess
        </TabsTrigger>
      </TabsList>

      <TabsContent value="binary">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Dice1 className="w-5 h-5 text-purple-400" />
              Binary Guess Battle
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Stake: 1 USDT • 5 Rounds • Winner takes all
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={createGame}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
            >
              {isLoading ? "Creating..." : "Create New Game"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-gray-400">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter game code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                maxLength={6}
              />
              <Button
                onClick={() => joinGame(joinCode)}
                disabled={!joinCode || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Joining..." : "Join Game"}
              </Button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chess">
        <ChessTabContent />
      </TabsContent>
    </Tabs>
  );
}

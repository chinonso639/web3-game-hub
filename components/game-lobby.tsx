'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/hooks/use-game';
import { Dice1, Users, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function GameLobby() {
  const [joinCode, setJoinCode] = useState('');
  const { gameState, isLoading, error, createGame, joinGame } = useGame();

  const copyGameCode = () => {
    if (gameState?.gameCode) {
      navigator.clipboard.writeText(gameState.gameCode);
      toast.success('Game code copied to clipboard!');
    }
  };

  if (gameState) {
    if (gameState.status === 'waiting') {
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
              <p className="text-gray-400 mb-2">Share this code with your opponent:</p>
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
    <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
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
          {isLoading ? 'Creating...' : 'Create New Game'}
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
            {isLoading ? 'Joining...' : 'Join Game'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
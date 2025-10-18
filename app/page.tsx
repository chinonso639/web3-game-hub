"use client";

import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/wallet-connect";
import { NetworkChecker } from "@/components/network-checker";
import { UsdtBalance } from "@/components/usdt-balance";
import { GameLobby } from "@/components/game-lobby";
import { GameBoard } from "@/components/game-board";
import { UsernameModal } from "@/components/username-modal";
import { useGame } from "@/hooks/use-game";
import { useUsername } from "@/hooks/use-username";
import { usePolygon } from "@/hooks/use-polygon";
import { Card, CardContent } from "@/components/ui/card";
import { Dice1, Coins, Users, Zap } from "lucide-react";

export default function Home() {
  const { isConnected } = useAccount();
  const { gameState } = useGame();
  const { showModal, isLoading, saveUsername } = useUsername();
  const { isCorrectNetwork } = usePolygon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20">
      <UsernameModal
        isOpen={showModal}
        onSubmit={saveUsername}
        isLoading={isLoading}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Only show header and features when not in game */}
        {(!isConnected ||
          !gameState ||
          (gameState.status !== "active" &&
            gameState.status !== "completed")) && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <Dice1 className="w-8 h-8 text-purple-400" />
                Binary Guess Battle
              </h1>
              <p className="text-gray-400 text-lg">
                The ultimate multiplayer guessing game with real cryptocurrency
                stakes
              </p>
            </div>

            {/* Network Checker */}
            {isConnected && <NetworkChecker />}

            {/* USDT Balance */}
            {isConnected && isCorrectNetwork && <UsdtBalance />}

            {/* Features Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center gap-3 p-4">
                  <Coins className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-white font-semibold">1 USDT Stakes</h3>
                    <p className="text-gray-400 text-sm">On Polygon Network</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="text-white font-semibold">
                      Real-time Multiplayer
                    </h3>
                    <p className="text-gray-400 text-sm">Live opponents</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex items-center gap-3 p-4">
                  <Zap className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="text-white font-semibold">5 Rounds</h3>
                    <p className="text-gray-400 text-sm">Powered by Polygon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!isConnected ? (
            <div className="space-y-6">
              <WalletConnect />
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    How to Play
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-blue-400 mb-2">
                        1. Connect Wallet
                      </h3>
                      <p className="text-sm">
                        Connect MetaMask and switch to Polygon network
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-400 mb-2">
                        2. Stake USDT
                      </h3>
                      <p className="text-sm">
                        Each player stakes 1 USDT to enter the game
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-400 mb-2">
                        3. Guess Binary
                      </h3>
                      <p className="text-sm">
                        Choose 0 or 1 for each of 5 rounds
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-400 mb-2">
                        4. Win & Earn
                      </h3>
                      <p className="text-sm">
                        Winner takes both stakes (2 USDT total)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : !isCorrectNetwork ? (
            <div className="text-center">
              <p className="text-gray-400">
                Please switch to Polygon network to continue
              </p>
            </div>
          ) : gameState?.status === "active" ||
            gameState?.status === "completed" ? (
            <GameBoard />
          ) : (
            <GameLobby />
          )}
        </div>
      </div>
    </div>
  );
}

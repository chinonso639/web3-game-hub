"use client";

import { useAccount, useDisconnect } from "wagmi";
import { usePolygon } from "@/hooks/use-polygon";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";

export function WalletStatus() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isCorrectNetwork, currentChain } = usePolygon();

  if (!isConnected) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isCorrectNetwork ? "bg-green-500" : "bg-orange-500"
            }`}
          />
          <Wallet className="w-4 h-4 text-blue-400" />
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <span
              className={`text-xs ${
                isCorrectNetwork ? "text-green-400" : "text-orange-400"
              }`}
            >
              {currentChain}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white h-8 px-2"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

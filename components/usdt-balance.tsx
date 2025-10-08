"use client";

import { usePolygon } from "@/hooks/use-polygon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, RefreshCw } from "lucide-react";

export function UsdtBalance() {
  const { usdtBalance, isCorrectNetwork, refreshBalance, currentChain } =
    usePolygon();

  if (!isCorrectNetwork) return null;

  return (
    <Card className="bg-slate-800/50 border-slate-700 mb-6">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Coins className="w-6 h-6 text-green-400" />
          <div>
            <div className="text-white font-semibold">{usdtBalance} USDT</div>
            <div className="text-gray-400 text-sm">{currentChain} Balance</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshBalance}
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

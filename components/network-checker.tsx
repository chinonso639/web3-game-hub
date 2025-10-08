"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { usePolygon } from "@/hooks/use-polygon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriangleAlert as AlertTriangle, Zap } from "lucide-react";

export function NetworkChecker() {
  const { isConnected } = useAccount();
  const { isCorrectNetwork, switchToPolygon, isLoading, currentChain } =
    usePolygon();

  useEffect(() => {
    // Auto-switch when wallet connects if not on correct network
    if (isConnected && !isCorrectNetwork) {
      const timer = setTimeout(() => {
        switchToPolygon();
      }, 1000); // Small delay to let wallet connection settle

      return () => clearTimeout(timer);
    }
  }, [isConnected, isCorrectNetwork, switchToPolygon]);

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <Card className="bg-orange-900/50 border-orange-700 max-w-md mx-auto mb-6">
      <CardHeader className="text-center">
        <CardTitle className="text-orange-400 flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Wrong Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-orange-300 mb-2">
            You're currently on <strong>{currentChain}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-4">
            This game requires Polygon network for USDT payments and low gas
            fees.
          </p>
        </div>
        <Button
          onClick={switchToPolygon}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Switching...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Switch to Polygon
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UsernameModal } from "@/components/username-modal";
import { useUsername } from "@/hooks/use-username";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { username, showModal, isLoading, saveUsername } = useUsername();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-6 text-center text-gray-400">
        Loading wallet...
      </Card>
    );
  }
  // ✅ Prevent server/client mismatch

  if (isConnected) {
    return (
      <>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="text-sm text-gray-400">Connected as</p>
                <p className="text-white font-semibold">
                  {username || "Loading..."}
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </CardContent>
        </Card>
        <UsernameModal
          isOpen={showModal}
          onSubmit={saveUsername}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-white mb-1">
            Connect Wallet
          </h3>
          <p className="text-gray-400 text-sm">
            Connect your MetaMask wallet to start playing
          </p>
        </div>
        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => connect({ connector })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Connect {connector.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

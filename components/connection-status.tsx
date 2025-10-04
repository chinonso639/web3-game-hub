'use client';

import { useSocket } from '@/providers/socket-provider';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected } = useSocket();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isConnected ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
      }`}>
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
}
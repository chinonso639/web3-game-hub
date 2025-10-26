"use client";

import { useSocket as useMainSocket } from "@/providers/socket-provider";
import { useChessSocket } from "@/providers/chess-socket-provider";

// Combined convenience hook that surfaces both sockets from their providers.
// Note: Prefer importing from the individual providers directly when only one is needed.
export function useSockets() {
  const { socket, isConnected } = useMainSocket();
  const { chessSocket, isChessConnected } = useChessSocket();

  return {
    socket,
    isConnected,
    chessSocket,
    isChessConnected,
  };
}

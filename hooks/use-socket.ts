import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { socket, chessSocket } from "@/lib/socket-client";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    if (!chessSocket.connected) {
      chessSocket.connect();
    }

    const handleConnect = () => {
      console.log("✅ Connected to main socket");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("❌ Disconnected from main socket");
      setIsConnected(false);
    };

    const handleError = (err: Error) => {
      console.error("Socket error:", err.message);
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.disconnect();
      chessSocket.disconnect();
    };
  }, []);

  return {
    socket,
    chessSocket,
    isConnected,
  };
}

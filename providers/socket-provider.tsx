"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance: Socket;

    const init = async () => {
      try {
        // 👇 This ensures server is started before connecting websocket
        await fetch("/api/socket");

        socketInstance = io(
          process.env.NODE_ENV === "production"
            ? undefined
            : "http://localhost:3000",
          {
            path: "/api/socket",
            transports: ["polling", "websocket"], // ✅ pure websocket
          }
        );

        socketInstance.on("connect", () => {
          console.log("✅ Socket connected:", socketInstance.id);
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          console.log("❌ Socket disconnected");
          setIsConnected(false);
        });

        socketInstance.on("connect_error", (err) => {
          console.error("⚠️ Socket connect error:", err.message);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error("Socket init failed:", error);
      }
    };

    init();

    return () => {
      socketInstance?.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type ChessSocketContextType = {
  chessSocket: Socket | null;
  isChessConnected: boolean;
};

const ChessSocketContext = createContext<ChessSocketContextType>({
  chessSocket: null,
  isChessConnected: false,
});

export const useChessSocket = () => useContext(ChessSocketContext);

export function ChessSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chessSocket, setChessSocket] = useState<Socket | null>(null);
  const [isChessConnected, setIsChessConnected] = useState(false);

  useEffect(() => {
    let s: Socket | null = null;

    const init = async () => {
      try {
        // Kick API route to ensure Socket.IO server starts
        await fetch("/api/chess", { method: "GET" });

        // s = io(
        //   typeof window !== "undefined" ? window.location.origin : undefined,
        //   {
        //     path: "/api/chess-io",
        //     transports: ["polling", "websocket"],
        //     withCredentials: true,
        //     autoConnect: true,
        //   }
        // );
        s = io(
          typeof window !== "undefined" ? window.location.origin : undefined,
          {
            path: "/api/chess-io",
            transports: ["websocket"],
            withCredentials: true,
            autoConnect: true,
          }
        );

        s.on("connect", () => {
          setIsChessConnected(true);
        });
        s.on("disconnect", () => {
          setIsChessConnected(false);
        });
        s.on("connect_error", (e) => {
          // eslint-disable-next-line no-console
          console.error("Chess socket connect error:", e);
        });

        setChessSocket(s);
        // Ensure connection is initiated
        if (!s.connected) {
          try {
            s.connect();
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to initialize chess socket:", e);
      }
    };

    init();

    return () => {
      s?.close();
    };
  }, []);

  return (
    <ChessSocketContext.Provider value={{ chessSocket, isChessConnected }}>
      {children}
    </ChessSocketContext.Provider>
  );
}

import { useEffect } from "react";
import type { AppProps } from "next/app";
import { SocketProvider } from "@/providers/socket-provider";
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // ✅ This ensures the Socket.IO server is started
    fetch("/api/socket");
  }, []);

  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  );
}

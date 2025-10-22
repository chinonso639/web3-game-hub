import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/web3-provider";
import { SocketProvider } from "@/providers/socket-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionStatus } from "@/components/connection-status";
import { WalletStatus } from "@/components/wallet-status";
import { ChessSocketProvider } from "@/providers/chess-socket-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Binary Guess Battle - Multiplayer Web3 Game",
  description:
    "Competitive multiplayer guessing game with cryptocurrency stakes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 min-h-screen`}>
        <Web3Provider>
          <SocketProvider>
            <ChessSocketProvider>
              <WalletStatus />
              <ConnectionStatus />
              {children}
              <Toaster />
            </ChessSocketProvider>
          </SocketProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

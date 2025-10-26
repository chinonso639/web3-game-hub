import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useChessSocket } from "@/providers/chess-socket-provider";
import type { Square } from "chess.js";

export type ChessMove = { from: Square; to: Square };
export type ChessColor = "white" | "black";

export type ChessGameState = {
  gameCode: string | null;
  color: ChessColor | null;
  isPlaying: boolean;
  isMyTurn: boolean;
  isFinished?: boolean;
  result?: { reason: string; winner?: ChessColor } | null;
};

export function useChess() {
  const { chessSocket } = useChessSocket();
  const colorRef = useRef<ChessColor | null>(null);
  const gameStartedRef = useRef<boolean>(false);
  const initialTurnSetRef = useRef<boolean>(false);
  const [state, setState] = useState<ChessGameState>({
    gameCode: null,
    color: null,
    isPlaying: false,
    isMyTurn: false,
    isFinished: false,
    result: null,
  });
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);

  // Hydrate from sessionStorage only on the chess board route
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const onChessPage = window.location.pathname.startsWith("/chess");
      if (!onChessPage) return;
      const stored = sessionStorage.getItem("chess.state");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ChessGameState>;
        setState((prev) => ({
          ...prev,
          gameCode: parsed.gameCode ?? prev.gameCode,
          color: (parsed.color as ChessColor | null) ?? prev.color,
          isPlaying: parsed.isPlaying ?? prev.isPlaying,
          isMyTurn: parsed.isMyTurn ?? prev.isMyTurn,
          isFinished: parsed.isFinished ?? false,
          result: (parsed.result as any) ?? null,
        }));
        colorRef.current = (parsed.color as ChessColor | null) ?? null;
      }
    } catch {
      // ignore
    }
  }, []);

  const isReady = useMemo(() => Boolean(chessSocket?.connected), [chessSocket]);

  const createGame = useCallback(async (): Promise<string> => {
    if (!chessSocket) throw new Error("Chess socket not initialized");
    // Ensure server is up and socket is connected before emitting
    await fetch("/api/chess").catch(() => {});

    if (!chessSocket.connected) {
      await new Promise<void>((resolve, reject) => {
        let done = false;
        const cleanup = () => {
          chessSocket.off("connect", handleConnect);
          chessSocket.off("connect_error", handleError as any);
          clearTimeout(timer);
        };
        const handleConnect = () => {
          if (done) return;
          done = true;
          cleanup();
          resolve();
        };
        const handleError = (err: unknown) => {
          if (done) return;
          done = true;
          cleanup();
          reject(err instanceof Error ? err : new Error("Connection error"));
        };
        chessSocket.once("connect", handleConnect);
        chessSocket.once("connect_error", handleError as any);
        // Trigger connect if needed
        try {
          chessSocket.connect();
        } catch {
          /* ignore */
        }
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          cleanup();
          reject(new Error("Timed out connecting to chess server"));
        }, 10000);
      });
    }

    const code = await new Promise<string>((resolve, reject) => {
      let settled = false;
      chessSocket.emit("chess:create", ({ gameCode }: { gameCode: string }) => {
        settled = true;
        setState((prev) => ({ ...prev, gameCode, isPlaying: false }));
        resolve(gameCode);
      });
      setTimeout(() => {
        if (!settled) reject(new Error("No response creating chess game"));
      }, 8000);
    });
    return code;
  }, [chessSocket]);

  const joinGame = useCallback(
    async (gameCode: string): Promise<void> => {
      if (!chessSocket) throw new Error("Chess socket not initialized");

      // Ensure server is up and socket is connected before emitting
      await fetch("/api/chess").catch(() => {});

      if (!chessSocket.connected) {
        await new Promise<void>((resolve, reject) => {
          let done = false;
          const cleanup = () => {
            chessSocket.off("connect", handleConnect);
            chessSocket.off("connect_error", handleError as any);
            clearTimeout(timer);
          };
          const handleConnect = () => {
            if (done) return;
            done = true;
            cleanup();
            resolve();
          };
          const handleError = (err: unknown) => {
            if (done) return;
            done = true;
            cleanup();
            reject(err instanceof Error ? err : new Error("Connection error"));
          };
          chessSocket.once("connect", handleConnect);
          chessSocket.once("connect_error", handleError as any);
          try {
            chessSocket.connect();
          } catch {
            /* ignore */
          }
          const timer = setTimeout(() => {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error("Timed out connecting to chess server"));
          }, 10000);
        });
      }

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error("No response joining chess game"));
        }, 8000);

        chessSocket.emit(
          "chess:join",
          { gameCode },
          (res?: { ok: boolean; message?: string }) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (res && res.ok) {
              // State will be updated by subsequent events (joined + gameStart)
              resolve();
            } else {
              reject(new Error(res?.message || "Failed to join chess game"));
            }
          }
        );
      });
    },
    [chessSocket]
  );

  const makeMove = useCallback(
    (move: ChessMove) => {
      if (!chessSocket || !state.gameCode) return;
      chessSocket.emit("chess:move", { gameCode: state.gameCode, move });
      setState((prev) => ({ ...prev, isMyTurn: false }));
    },
    [chessSocket, state.gameCode]
  );

  useEffect(() => {
    if (!chessSocket) return;
    const handleGameCreated = ({ gameCode }: { gameCode: string }) => {
      setState((prev) => ({
        ...prev,
        gameCode,
        isPlaying: false,
        isFinished: false,
        result: null,
      }));
    };
    const handleJoined = ({
      color,
      gameCode,
    }: {
      color: ChessColor;
      gameCode?: string;
    }) => {
      colorRef.current = color;
      setState((prev) => {
        const next = {
          ...prev,
          color,
          // don't mark playing here; wait for gameStart
          isPlaying: prev.isPlaying,
          gameCode: prev.gameCode ?? gameCode ?? null,
        };
        // If game has already started (race), compute turn now
        if (gameStartedRef.current) {
          return { ...next, isMyTurn: color === "white", isPlaying: true };
        }
        return next;
      });
    };
    const handleGameStart = () => {
      gameStartedRef.current = true;
      const c = colorRef.current;
      const first = c === "white";
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isFinished: false,
        result: null,
        // Only decide turn if we already know color; otherwise keep previous and let handleJoined fix it
        isMyTurn: c ? first : prev.isMyTurn,
      }));
    };
    const handleMove = (move: ChessMove) => {
      setLastMove(move);
      // Turn will be driven by server 'chess:turn' events; do not flip here
      // setState((prev) => ({ ...prev, isMyTurn: true }));
    };
    const handleGameOver = ({
      reason,
      winner,
    }: {
      reason: string;
      winner?: ChessColor;
    }) => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isFinished: true,
        result: { reason, winner: winner ?? undefined },
        isMyTurn: false,
      }));
    };
    const handleTurn = ({ yourTurn }: { yourTurn: boolean }) => {
      setState((prev) => {
        if (prev.isFinished) return prev; // ignore after finish
        return { ...prev, isMyTurn: yourTurn };
      });
    };
    chessSocket.on("chess:gameCreated", handleGameCreated);
    chessSocket.on("chess:joined", handleJoined);
    chessSocket.on("chess:gameStart", handleGameStart);
    chessSocket.on("chess:moveReceived", handleMove);
    chessSocket.on("chess:turn", handleTurn);
    chessSocket.on("chess:gameOver", handleGameOver);
    return () => {
      chessSocket.off("chess:gameCreated", handleGameCreated);
      chessSocket.off("chess:joined", handleJoined);
      chessSocket.off("chess:gameStart", handleGameStart);
      chessSocket.off("chess:moveReceived", handleMove);
      chessSocket.off("chess:turn", handleTurn);
      chessSocket.off("chess:gameOver", handleGameOver);
    };
  }, [chessSocket]);

  // Stabilize initial turn after navigation or hydration
  useEffect(() => {
    if (!state.isPlaying) return;
    if (initialTurnSetRef.current) return;
    // If server didn't send turn yet, fall back to color-based init exactly once
    if (colorRef.current) {
      initialTurnSetRef.current = true;
      setState((prev) => ({ ...prev, isMyTurn: colorRef.current === "white" }));
    }
  }, [state.isPlaying]);

  // Persist to sessionStorage only on the chess board route
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const onChessPage = window.location.pathname.startsWith("/chess");
      if (!onChessPage) return;
      const toStore: ChessGameState = {
        gameCode: state.gameCode,
        color: state.color,
        isPlaying: state.isPlaying,
        isMyTurn: state.isMyTurn,
        isFinished: state.isFinished ?? false,
        result: state.result ?? null,
      };
      sessionStorage.setItem("chess.state", JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }, [state.gameCode, state.color, state.isPlaying, state.isMyTurn]);

  return {
    ...state,
    isReady,
    lastMove,
    createGame,
    joinGame,
    makeMove,
    reportGameOver: async (payload: {
      reason: string;
      winner?: ChessColor;
    }) => {
      if (!chessSocket || !state.gameCode) return;
      chessSocket.emit("chess:gameOver", {
        gameCode: state.gameCode,
        ...payload,
      });
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isFinished: true,
        result: { reason: payload.reason, winner: payload.winner },
        isMyTurn: false,
      }));
    },
    async leaveGame() {
      if (!chessSocket || !state.gameCode) {
        // Clear local state regardless
        try {
          sessionStorage.removeItem("chess.state");
        } catch {}
        setState({
          gameCode: null,
          color: null,
          isPlaying: false,
          isMyTurn: false,
          isFinished: false,
          result: null,
        });
        return;
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000);
        chessSocket.emit("chess:leave", { gameCode: state.gameCode }, () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      try {
        sessionStorage.removeItem("chess.state");
      } catch {}
      setState({
        gameCode: null,
        color: null,
        isPlaying: false,
        isMyTurn: false,
        isFinished: false,
        result: null,
      });
    },
  };
}

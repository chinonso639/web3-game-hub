export type GameType = "guessing" | "guessing-practice" | "chess";

export type ChessGameState = {
  gameCode: string;
  players: {
    id: string;
    username: string;
    color: "white" | "black";
  }[];
  status: "waiting" | "playing" | "finished";
  winner?: string;
};

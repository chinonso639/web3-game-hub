import { io } from "socket.io-client";

export const socket = io({
  path: "pages/api/socket",
  autoConnect: false,
});

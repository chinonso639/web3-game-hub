// types/next.d.ts
import { Server as IOServer } from "socket.io";
import { Socket } from "net";

declare module "http" {
  interface IncomingMessage {
    socket: Socket;
  }
}

declare module "net" {
  interface Socket {
    server: any;
  }
}

declare module "next" {
  import { NextApiResponse } from "next";

  export interface NextApiResponseServerIO extends NextApiResponse {
    socket: any & {
      server: {
        io?: IOServer;
      };
    };
  }
}

import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";

import { NextApiResponseServerIo } from "@/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Replace with your allowed origin
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "*"); // Adjust allowed headers if needed
  res.status(200).json({ message: "CORS preflight request handled" });
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      // @ts-ignore
      addTrailingSlash: false,
      cors: {
        origin: "*",
        // Replace with your allowed origin
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["*"],
      },
    });
    res.socket.server.io = io;
    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
      socket.on("message", (msg) => {
        console.log("Received message:", msg);
        io.emit("message", msg);
      });
      socket.on("video-frame", (frame) => {
        console.log("Received frame:", frame);
        io.emit("video-frame", frame);
      });
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
      socket.on("error", (error) => {
        console.log("Socket error:", error);
      });
    });
  }
  console.log("Socket server initialized");
  res.end();
};

export default ioHandler;

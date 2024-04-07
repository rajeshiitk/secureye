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
      socket.on("stream", (msg) => {
        console.log("Received stream:", msg);
        io.emit("stream", msg);
      });

      socket.on("room:join", (data) => {
        const { room } = data;
        console.log("User joined room:", room);
        io.emit("user:joined", { id: socket.id });
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
      });

      socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incomming:call", { from: socket.id, offer });
        console.log("User call:", { to, offer });
      });

      socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
        console.log("Call accepted:", { to, ans });
      });

      socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
      });

      socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
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

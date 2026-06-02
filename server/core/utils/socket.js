import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production security if needed
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    
    // Admins can join an "admin" room to receive specific alerts
    socket.on("join_admin", () => {
      socket.join("admin_room");
      console.log(`[Socket.io] Socket ${socket.id} joined admin_room`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io not initialized!");
  }
  return io;
};

import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem("ironmind_token");
  socket = io(API_BASE_URL, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

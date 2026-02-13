import { io } from "socket.io-client";

const getBaseUrl = () => {

  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:3000";
  // Remove /api and everything after it
  return url.split('/api')[0];
};

const SOCKET_URL = getBaseUrl();

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'] // Better compatibility
});


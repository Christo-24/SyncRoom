export const SOCKET_BASE = (
  import.meta.env.VITE_WS_URL ||
  "localhost:8000"
);

export const MESSAGE_PAGE_SIZE = 30;

export const SOCKET_RECONNECT_DELAY =
  3000;
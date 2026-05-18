export const SOCKET_BASE = (
  import.meta.env.VITE_WS_URL ||
  (typeof window !== "undefined" ? window.location.host : "")
);

export const MESSAGE_PAGE_SIZE = 30;

export const SOCKET_RECONNECT_DELAY =
  Number(import.meta.env.VITE_WS_RECONNECT_DELAY || 5000);
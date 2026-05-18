import { SOCKET_RECONNECT_DELAY } from "../utils/constants";

class SocketService {
  constructor() {
    this.socket = null;
    this.socketUrl = null;
    this.socketCallbacks = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.shouldReconnect = false;

    this.globalSocket = null;
    this.globalSocketUrl = null;
    this.globalSocketCallbacks = null;
    this.globalReconnectTimeout = null;
    this.globalReconnectAttempts = 0;
    this.globalShouldReconnect = false;
  }

  getSocketState(socket) {
    const stateMap = {
      0: "CONNECTING",
      1: "OPEN",
      2: "CLOSING",
      3: "CLOSED",
    };

    return socket ? stateMap[socket.readyState] || "UNKNOWN" : "NO_SOCKET";
  }

  getReconnectDelay(attempts) {
    return Math.min(60000, SOCKET_RECONNECT_DELAY * (2 ** attempts));
  }

  shouldRetry(code) {
    return code !== 1000 && code !== 1008 && code < 4000;
  }

  connect({ url, onMessage, onOpen, onClose, reconnect = true }) {
    if (!url) {
      console.warn("[WS:room] missing url");
      return;
    }

    if (this.socket && this.socketUrl === url) {
      const state = this.socket.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
    }

    if (this.socket && this.socketUrl !== url) {
      this.disconnect();
    }

    this.socketUrl = url;
    this.socketCallbacks = { onMessage, onOpen, onClose };
    this.shouldReconnect = reconnect;
    this.reconnectAttempts = 0;

    console.log("[WS:room] connect", url);

    try {
      this.socket = new WebSocket(url);
    } catch (error) {
      console.error("[WS:room] connect error", error);
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      if (onOpen) onOpen();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error("[WS:room] parse error", error);
      }
    };

    this.socket.onclose = (event) => {
      console.log("[WS:room] disconnect", event.code);
      if (onClose) onClose(event);

      if (this.socket) {
        this.socket = null;
      }

      if (this.shouldReconnect && this.socketUrl === url && this.shouldRetry(event.code)) {
        const delay = this.getReconnectDelay(this.reconnectAttempts);
        console.log("[WS:room] reconnect in", delay);
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null;
          if (this.shouldReconnect && this.socketUrl === url) {
            this.reconnectAttempts += 1;
            this.connect({
              url,
              onMessage: this.socketCallbacks?.onMessage,
              onOpen: this.socketCallbacks?.onOpen,
              onClose: this.socketCallbacks?.onClose,
              reconnect: true,
            });
          }
        }, delay);
      }
    };

    this.socket.onerror = (error) => {
      console.error("[WS:room] error", error);
    };
  }

  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(JSON.stringify(data));
    return true;
  }

  disconnect() {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      console.log("[WS:room] disconnect");
      this.socket.close();
      this.socket = null;
    }
  }

  connectNotifications({ url, onMessage, onOpen, onClose, reconnect = true }) {
    if (!url) {
      console.warn("[WS:notifications] missing url");
      return;
    }

    if (this.globalSocket && this.globalSocketUrl === url) {
      const state = this.globalSocket.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
    }

    if (this.globalSocket && this.globalSocketUrl !== url) {
      this.disconnectNotifications();
    }

    this.globalSocketUrl = url;
    this.globalSocketCallbacks = { onMessage, onOpen, onClose };
    this.globalShouldReconnect = reconnect;
    this.globalReconnectAttempts = 0;

    console.log("[WS:notifications] connect", url);

    try {
      this.globalSocket = new WebSocket(url);
    } catch (error) {
      console.error("[WS:notifications] connect error", error);
      return;
    }

    this.globalSocket.onopen = () => {
      this.globalReconnectAttempts = 0;
      if (onOpen) onOpen();
    };

    this.globalSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error("[WS:notifications] parse error", error);
      }
    };

    this.globalSocket.onclose = (event) => {
      console.log("[WS:notifications] disconnect", event.code);
      if (onClose) onClose(event);

      if (this.globalSocket) {
        this.globalSocket = null;
      }

      if (this.globalShouldReconnect && this.globalSocketUrl === url && this.shouldRetry(event.code)) {
        const delay = this.getReconnectDelay(this.globalReconnectAttempts);
        console.log("[WS:notifications] reconnect in", delay);
        this.globalReconnectTimeout = setTimeout(() => {
          this.globalReconnectTimeout = null;
          if (this.globalShouldReconnect && this.globalSocketUrl === url) {
            this.globalReconnectAttempts += 1;
            this.connectNotifications({
              url,
              onMessage: this.globalSocketCallbacks?.onMessage,
              onOpen: this.globalSocketCallbacks?.onOpen,
              onClose: this.globalSocketCallbacks?.onClose,
              reconnect: true,
            });
          }
        }, delay);
      }
    };

    this.globalSocket.onerror = (error) => {
      console.error("[WS:notifications] error", error);
    };
  }

  disconnectNotifications() {
    this.globalShouldReconnect = false;

    if (this.globalReconnectTimeout) {
      clearTimeout(this.globalReconnectTimeout);
      this.globalReconnectTimeout = null;
    }

    if (this.globalSocket) {
      console.log("[WS:notifications] disconnect");
      this.globalSocket.close();
      this.globalSocket = null;
    }
  }
}

const socketService = new SocketService();

export default socketService;
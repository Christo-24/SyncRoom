class SocketService {

  constructor() {
    this.socket = null;
    this.reconnectTimeout = null;
    this.globalSocket = null;
    this.globalReconnectTimeout = null;
  }

  connect({
    url,
    onMessage,
    onOpen,
    onClose
  }) {

    if (!url) {
      console.warn("SocketService.connect called with empty url");
      return;
    }

    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      return;
    }

    try {
      this.socket = new WebSocket(url);
    } catch (err) {
      console.error("Failed to create WebSocket", err);
      return;
    }

    this.socket.onopen = () => {

      console.log(
        "WebSocket connected"
      );

      if (onOpen) {
        onOpen();
      }
    };

    this.socket.onmessage = (
      event
    ) => {

      try {

        const data = JSON.parse(
          event.data
        );

        if (onMessage) {
          onMessage(data);
        }

      } catch (error) {

        console.error(
          "Socket parse error",
          error
        );
      }
    };

    this.socket.onclose = (
      event
    ) => {

      console.log(
        "WebSocket disconnected",
        event.code
      );

      if (onClose) {
        onClose(event);
      }
    };

    this.socket.onerror = (
      error
    ) => {

      console.error(
        "WebSocket error",
        error
      );
    };
  }

  send(data) {

    if (!this.socket) {
      console.error("❌ WebSocket send failed: socket is null");
      return false;
    }

    const readyStateMap = {
      0: "CONNECTING",
      1: "OPEN",
      2: "CLOSING",
      3: "CLOSED"
    };

    const currentState = readyStateMap[this.socket.readyState];

    if (this.socket.readyState !== WebSocket.OPEN) {
      console.error(`❌ WebSocket send failed: socket state is ${currentState} (expected OPEN)`);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(data));
      console.log("✅ WebSocket message sent:", data);
      return true;
    } catch (err) {
      console.error("❌ WebSocket send error:", err);
      return false;
    }
  }

  disconnect() {

    if (this.reconnectTimeout) {
      clearTimeout(
        this.reconnectTimeout
      );
    }

    if (this.socket) {

      this.socket.close();

      this.socket = null;
    }
  }

  connectNotifications({ url, onMessage, onOpen, onClose }) {

    if (!url) {
      console.warn("SocketService.connectNotifications called with empty url");
      return;
    }

    if (this.globalSocket) {
      const state = this.globalSocket.readyState;
      // avoid creating a second socket while one is OPEN or CONNECTING
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
      // if previous socket is in CLOSING/CLOSED, ensure it's cleaned
      try {
        this.globalSocket.close();
      } catch (e) {}
      this.globalSocket = null;
    }

    try {
      this.globalSocket = new WebSocket(url);
    } catch (err) {
      console.error("Failed to create global WebSocket", err);
      return;
    }

    this.globalSocket.onopen = () => {
      console.log("Global WebSocket connected");
      if (onOpen) onOpen();
    };

    this.globalSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error("Global socket parse error", error);
      }
    };

    this.globalSocket.onclose = (event) => {
      console.log("Global WebSocket disconnected", event.code);
      if (onClose) onClose(event);
    };

    this.globalSocket.onerror = (error) => {
      console.error("Global WebSocket error", error);
    };
  }

  disconnectNotifications() {

    if (this.globalReconnectTimeout) {
      clearTimeout(this.globalReconnectTimeout);
    }

    if (this.globalSocket) {
      this.globalSocket.close();
      this.globalSocket = null;
    }
  }
}

const socketService =
  new SocketService();

export default socketService;
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = new Map();
  }

  connect(url) {
    if (this.socket) return;

    this.socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this._setupListeners();
  }

  _setupListeners() {
    const events = [
      "connect",
      "disconnect",
      "connect_error",
      "reconnect",
      "reconnect_attempt",
      "reconnect_failed",
      "gameStateUpdate",
      "gameStart",
      "gameJoined",
      "playerJoined",
      "moveMade",
      "moveError",
      "gameError",
      "rematchRequest",
      "rematchStarted",
      "gameReset",
      "gameOver",
      "playerStatusUpdate",
      "playerDisconnected",
      "publicRoomsUpdate",
      "gameCreated",
      "createError",
      "joinError",
    ];

    events.forEach((event) => {
      this.socket.on(event, (data) => {
        this._notify(event, data);
      });
    });
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.callbacks.has(event)) return;
    const filtered = this.callbacks.get(event).filter((cb) => cb !== callback);
    this.callbacks.set(event, filtered);
  }

  _notify(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach((cb) => cb(data));
    }
  }

  emit(event, data) {
    if (this.socket) {
      if (data !== undefined) {
        this.socket.emit(event, data);
      } else {
        this.socket.emit(event);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

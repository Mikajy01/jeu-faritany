import { io } from "socket.io-client";

class SocketService {
  socket: any;
  callbacks: Map<string, Array<(data: any) => void>>;

  constructor() {
    this.socket = null;
    this.callbacks = new Map();
  }

  connect(url: string) {
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
      "moveTimeout",
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

  on(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) return;
    const filtered = this.callbacks
      .get(event)!
      .filter((cb) => cb !== callback);
    this.callbacks.set(event, filtered);
  }

  _notify(event: string, data: any) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event)!.forEach((cb) => cb(data));
    }
  }

  emit(event: string, data?: any) {
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

// Lightweight WebSocket service for auction real-time updates (start/end times, extensions)
// Assumptions:
// 1. Backend sends JSON messages: { type: 'auction_time_update', auctionId, startTimeISO, endTimeISO, status? }
// 2. If no backend WS URL provided, we fall back to a local simulator that emits time ticks every second
// 3. This service keeps a single shared connection; subscribers filter by auctionId

export type AuctionTimeUpdateMessage = {
  type: 'auction_time_update';
  auctionId: string;
  startTimeISO: string; // ISO string
  endTimeISO: string;   // ISO string
  status?: 'upcoming' | 'live' | 'completed';
};

type MessageHandler = (msg: AuctionTimeUpdateMessage) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private simulatorIntervals: Map<string, number> = new Map();

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  configure(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws || !this.url) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'auction_time_update') {
            this.emit(data as AuctionTimeUpdateMessage);
          }
        } catch (e) {
          // Ignore malformed
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
        if (this.reconnectAttempts < this.maxReconnect) {
          const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), delay);
        }
      };
      this.ws.onerror = () => {
        // Force close to trigger reconnect
        try { this.ws?.close(); } catch (_) { /* noop */ }
      };
    } catch (err) {
      // Failed immediately
    }
  }

  private emit(msg: AuctionTimeUpdateMessage) {
    this.handlers.forEach(h => h(msg));
  }

  // Public method for external services to emit messages
  public emitUpdate(msg: AuctionTimeUpdateMessage) {
    this.emit(msg);
  }

  subscribeAuctionTimes(auctionId: string, handler: (msg: AuctionTimeUpdateMessage) => void, options?: { simulate?: boolean; startISO?: string; endISO?: string; }): () => void {
    const wrapped: MessageHandler = (msg) => {
      if (msg.auctionId === auctionId) handler(msg);
    };
    this.handlers.add(wrapped);

    // If no backend configured OR simulate flag set, start local simulator
    if ((!this.url || options?.simulate) && !this.simulatorIntervals.has(auctionId)) {
      this.startSimulator(auctionId, options?.startISO, options?.endISO);
    } else {
      this.connect();
      // Optionally send a subscribe frame if backend protocol requires
      this.send({ type: 'subscribe', auctionId });
    }

    return () => {
      this.handlers.delete(wrapped);
      const stillUsed = Array.from(this.handlers).some(h => h === wrapped);
      if (!stillUsed) {
        this.stopSimulator(auctionId);
      }
    };
  }

  private startSimulator(auctionId: string, startISO?: string, endISO?: string) {
    const start = startISO ? new Date(startISO) : new Date();
    const end = endISO ? new Date(endISO) : new Date(Date.now() + 30 * 60 * 1000); // +30min default
    const intervalId = window.setInterval(() => {
      const now = new Date();
      let status: 'upcoming' | 'live' | 'completed';
      if (now < start) status = 'upcoming';
      else if (now >= start && now <= end) status = 'live';
      else status = 'completed';
      const payload: AuctionTimeUpdateMessage = {
        type: 'auction_time_update',
        auctionId,
        startTimeISO: start.toISOString(),
        endTimeISO: end.toISOString(),
        status
      };
      this.emit(payload);
    }, 1000);
    this.simulatorIntervals.set(auctionId, intervalId);
  }

  private stopSimulator(auctionId: string) {
    const id = this.simulatorIntervals.get(auctionId);
    if (id) {
      clearInterval(id);
      this.simulatorIntervals.delete(auctionId);
    }
  }

  send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(JSON.stringify(obj)); } catch (_) { /* noop */ }
    }
  }
}

export default WebSocketService.getInstance();
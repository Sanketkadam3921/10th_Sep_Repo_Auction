import apiAuctionService from './apiAuctionService';
import wsService from './websocketService';

interface TimerData {
  auction_id: string;
  start_time: string;
  end_time: string;
  status: string;
  time_remaining?: number;
  is_extended?: boolean;
}

interface TimersResponse {
  success: boolean;
  data?: TimerData[];
  timers?: TimerData[];
  message?: string;
}

class AuctionTimerService {
  private static instance: AuctionTimerService;
  private pollInterval: number | null = null;
  private subscribers: Map<string, Set<(data: TimerData) => void>> = new Map();
  private lastTimerData: Map<string, TimerData> = new Map();

  static getInstance(): AuctionTimerService {
    if (!AuctionTimerService.instance) {
      AuctionTimerService.instance = new AuctionTimerService();
    }
    return AuctionTimerService.instance;
  }

  /**
   * Start polling the timers API and emit updates via WebSocket service
   */
  startPolling(intervalMs: number = 5000) {
    if (this.pollInterval) return; // Already polling

    console.log('[AuctionTimerService] Starting timer polling every', intervalMs, 'ms');
    
    const poll = async () => {
      try {
        const result = await apiAuctionService.fetchAuctionTimers();
        this.processTimersResponse(result);
      } catch (error) {
        console.warn('[AuctionTimerService] Poll failed:', error);
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    this.pollInterval = window.setInterval(poll, intervalMs);
  }

  /**
   * Stop polling the timers API
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('[AuctionTimerService] Stopped timer polling');
    }
  }

  /**
   * Process timers API response and emit WebSocket messages
   */
  private processTimersResponse(response: TimersResponse) {
    console.log('[AuctionTimerService] Processing timers response:', response);
    
    if (!response.success) {
      console.warn('[AuctionTimerService] API returned success:false', response.message);
      return;
    }

    const timers = response.data || response.timers || [];
    
    timers.forEach(timer => {
      const auctionId = timer.auction_id;
      const lastData = this.lastTimerData.get(auctionId);
      
      // Check if data has changed significantly
      if (!lastData || this.hasSignificantChange(lastData, timer)) {
        console.log('[AuctionTimerService] Timer update for auction', auctionId, timer);
        
        // Store the latest data
        this.lastTimerData.set(auctionId, timer);
        
        // Emit WebSocket message for components using wsService
        const wsMessage = {
          type: 'auction_time_update' as const,
          auctionId: auctionId,
          startTimeISO: timer.start_time,
          endTimeISO: timer.end_time,
          status: this.normalizeStatus(timer.status),
          timeRemaining: timer.time_remaining,
          isExtended: timer.is_extended
        };
        
        // Emit to WebSocket service (this will reach components using wsService.subscribeAuctionTimes)
        wsService.emitUpdate(wsMessage);
        
        // Emit to direct subscribers
        const subscribers = this.subscribers.get(auctionId);
        if (subscribers) {
          subscribers.forEach(callback => callback(timer));
        }
        
        // Emit to wildcard subscribers
        const wildcardSubscribers = this.subscribers.get('__all__');
        if (wildcardSubscribers) {
          wildcardSubscribers.forEach(callback => callback(timer));
        }
      }
    });
  }

  /**
   * Check if timer data has changed significantly (to avoid spam)
   */
  private hasSignificantChange(old: TimerData, current: TimerData): boolean {
    return (
      old.status !== current.status ||
      old.start_time !== current.start_time ||
      old.end_time !== current.end_time ||
      old.is_extended !== current.is_extended ||
      Math.abs((old.time_remaining || 0) - (current.time_remaining || 0)) > 5000 // 5 second threshold
    );
  }

  /**
   * Normalize status from API to match component expectations
   */
  private normalizeStatus(apiStatus: string): 'upcoming' | 'live' | 'completed' {
    const status = apiStatus.toLowerCase();
    if (status === 'live' || status === 'active') return 'live';
    if (status === 'completed' || status === 'finished' || status === 'ended') return 'completed';
    return 'upcoming';
  }

  /**
   * Subscribe to timer updates for a specific auction or all auctions
   */
  subscribe(auctionId: string, callback: (data: TimerData) => void): () => void {
    // Handle wildcard subscription
    if (auctionId === '*') {
      // For wildcard, we need to listen to all updates
      const wildcardKey = '__all__';
      if (!this.subscribers.has(wildcardKey)) {
        this.subscribers.set(wildcardKey, new Set());
      }
      this.subscribers.get(wildcardKey)!.add(callback as any);
      
      // Start polling if not already started
      if (!this.pollInterval) {
        this.startPolling();
      }
      
      return () => {
        const subs = this.subscribers.get(wildcardKey);
        if (subs) {
          subs.delete(callback as any);
          if (subs.size === 0) {
            this.subscribers.delete(wildcardKey);
          }
        }
        
        // Stop polling if no more subscribers
        if (this.subscribers.size === 0) {
          this.stopPolling();
        }
      };
    }
    
    // Regular subscription for specific auction
    if (!this.subscribers.has(auctionId)) {
      this.subscribers.set(auctionId, new Set());
    }
    
    this.subscribers.get(auctionId)!.add(callback);
    
    // Send current data if available
    const currentData = this.lastTimerData.get(auctionId);
    if (currentData) {
      callback(currentData);
    }
    
    // Start polling if not already started
    if (!this.pollInterval) {
      this.startPolling();
    }
    
    return () => {
      const subs = this.subscribers.get(auctionId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(auctionId);
        }
      }
      
      // Stop polling if no more subscribers
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  /**
   * Get the latest timer data for an auction
   */
  getTimerData(auctionId: string): TimerData | null {
    return this.lastTimerData.get(auctionId) || null;
  }

  /**
   * Manually fetch and process timers (useful for one-time checks)
   */
  async fetchAndProcess(): Promise<TimersResponse> {
    try {
      const result = await apiAuctionService.fetchAuctionTimers();
      this.processTimersResponse(result);
      return result;
    } catch (error) {
      console.error('[AuctionTimerService] Manual fetch failed:', error);
      throw error;
    }
  }
}

export default AuctionTimerService.getInstance();
export type { TimerData, TimersResponse };

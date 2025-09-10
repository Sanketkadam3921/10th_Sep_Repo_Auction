import { BaseAuction } from '../types/auction';

// Enhanced in-memory cache with performance optimizations
interface CacheEntry { 
  ts: number; 
  data: BaseAuction[];
  hits: number;
}
const LIST_CACHE = new Map<string, CacheEntry>();
const LIST_CACHE_TTL_MS = 15_000; // 15s for fresher data
const MAX_CACHE_SIZE = 50;

function getCache(key: string): BaseAuction[] | undefined {
  const hit = LIST_CACHE.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.ts > LIST_CACHE_TTL_MS) {
    LIST_CACHE.delete(key);
    return undefined;
  }
  hit.hits++;
  return hit.data;
}

function setCache(key: string, data: BaseAuction[]) {
  if (LIST_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(LIST_CACHE.entries())
      .sort((a, b) => a[1].ts - b[1].ts)[0][0];
    LIST_CACHE.delete(oldestKey);
  }
  LIST_CACHE.set(key, { ts: Date.now(), data, hits: 0 });
}

// Connection speed detection
function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.downlink < 1);
}

// Optimized fetch with timeout and retry logic
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Pre-fetch critical data in background
function prefetchCriticalData() {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Pre-fetch common auction lists in background
      const commonQueries = [
        { status: 'live' },
        { status: 'upcoming' },
        { type: 'created' }
      ];
      
      commonQueries.forEach(params => {
        const cacheKey = `filtered|${params.status || 'all'}|${(params as any).type || 'none'}|`;
        if (!getCache(cacheKey)) {
          // Only prefetch if not already cached
          optimizedFetchFilteredAuctions(params).catch(() => {
            // Ignore prefetch errors
          });
        }
      });
    });
  }
}

// Main optimized fetch function
export async function optimizedFetchFilteredAuctions(params: {
  status?: string;
  type?: string;
  search?: string;
  signal?: AbortSignal;
}): Promise<BaseAuction[]> {
  const cacheKey = `filtered|${params.status || 'all'}|${params.type || 'none'}|${(params.search || '').trim().toLowerCase()}`;
  
  // Check cache first (skip on slow connections)
  if (!params.signal && !isSlowConnection()) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.debug('[Optimized] Cache hit:', cacheKey, cached.length);
      return cached.slice();
    }
  }
  
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search.trim());
  
  const API_BASE_URL = 'https://auction-development.onrender.com/api/auction';
  const query = searchParams.toString();
  const url = `${API_BASE_URL}/list/filtered${query ? `?${query}` : ''}`;
  
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('authToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const startTime = performance.now();
    const response = await fetchWithTimeout(url, { headers, signal: params.signal });
    const elapsed = performance.now() - startTime;
    
    if (elapsed > 1000) {
      console.warn(`[Optimized] Slow response: ${elapsed.toFixed(0)}ms`);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract auctions from various response formats
    let auctions: any[] = [];
    if (Array.isArray(data)) {
      auctions = data;
    } else if (data.data && Array.isArray(data.data)) {
      auctions = data.data;
    } else if (data.auctions && Array.isArray(data.auctions)) {
      auctions = data.auctions;
    }
    
    // Basic mapping (simplified for performance)
    const mapped: BaseAuction[] = auctions.map(raw => ({
      id: raw.id || raw._id || crypto.randomUUID(),
      title: raw.title || raw.description?.split('\n')[0] || 'Auction',
      auctionNo: raw.auctionNo || raw.auction_no || 'AUC-' + (raw.id || '').slice(-6),
      auctionDate: (raw.auctionDate || raw.auction_date || new Date().toISOString().split('T')[0]).substring(0, 10),
      auctionStartTime: (raw.auctionStartTime || raw.start_time || '09:00').slice(0, 5),
      auctionEndTime: (raw.auctionEndTime || raw.end_time || '10:00').slice(0, 5),
      duration: raw.duration || 60,
      currency: raw.currency === 'USD' ? 'USD' : 'INR',
      auctionDetails: raw.auctionDetails || raw.description || '',
      openToAllCompanies: raw.openToAllCompanies || raw.open_to_all_companies || false,
      preBidOfferAllowed: raw.preBidOfferAllowed || raw.pre_bid_allowed || false,
      decrementalValue: raw.decrementalValue || raw.decremental_value || 0,
      startingPrice: raw.startingPrice || raw.base_price || 0,
      reservePrice: raw.reservePrice || raw.current_price || 0,
      status: (raw.status || 'upcoming').toLowerCase() as any,
      participants: Array.isArray(raw.participants) ? raw.participants : [],
      documents: [],
      userId: raw.userId || raw.created_by || 'unknown',
      auctioneerCompany: raw.company_name || raw.creator_company || '',
      auctioneerAddress: raw.auctioneerAddress || '',
      auctioneerPhone: raw.auctioneerPhone || '',
      createdBy: raw.createdBy || raw.created_by || 'unknown',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    }));
    
    // Cache results
    if (mapped.length > 0) {
      setCache(cacheKey, mapped);
    }
    
    console.debug(`[Optimized] Fetched ${mapped.length} auctions in ${elapsed.toFixed(0)}ms`);
    return mapped;
    
  } catch (error: any) {
    console.error('[Optimized] Fetch failed:', error.message);
    
    // Return cached data as fallback on error
    const cached = getCache(cacheKey);
    if (cached) {
      console.warn('[Optimized] Returning stale cache due to error');
      return cached.slice();
    }
    
    throw error;
  }
}

// Initialize prefetching when module loads
if (typeof window !== 'undefined') {
  // Delay to avoid blocking initial render
  setTimeout(prefetchCriticalData, 2000);
}

export default {
  fetchFilteredAuctions: optimizedFetchFilteredAuctions
};

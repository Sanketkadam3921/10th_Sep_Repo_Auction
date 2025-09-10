import { BaseAuction } from '../types/auction';

// --- Lightweight in-memory cache (resets on page reload) ------------------
// Keyed by serialized params (status|type|search variant). Short TTL to avoid
// stale data while dramatically reducing duplicate network calls when user
// types or toggles tabs quickly.
interface CacheEntry { ts: number; data: BaseAuction[] }
const LIST_CACHE = new Map<string, CacheEntry>();
const LIST_CACHE_TTL_MS = 30_000; // 30s soft TTL

function getCache(key: string): BaseAuction[] | undefined {
  const hit = LIST_CACHE.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.ts > LIST_CACHE_TTL_MS) {
    LIST_CACHE.delete(key);
    return undefined;
  }
  return hit.data;
}

function setCache(key: string, data: BaseAuction[]) {
  LIST_CACHE.set(key, { ts: Date.now(), data });
}

// IMPORTANT: Keep base URL ROOT ONLY (no trailing path like /list/filtered and no query params)
// Allow override via environment variable for flexibility in different deployments.
// CRA / Vite style env variable names (both supported):
//   REACT_APP_AUCTION_API_BASE_URL or VITE_AUCTION_API_BASE_URL
const RUNTIME_BASE = (
  (typeof process !== 'undefined' && (process as any).env?.REACT_APP_AUCTION_API_BASE_URL) ||
  (typeof process !== 'undefined' && (process as any).env?.VITE_AUCTION_API_BASE_URL)
);
const API_BASE_URL = (RUNTIME_BASE || 'https://auction-development.onrender.com/api/auction').replace(/\/?$/,'');
// const API_BASE_URL = (RUNTIME_BASE || 'https://auction-development.onrender.com/api/auction').replace(/\/?$/,'') + '/list/filtered';
// const url = `${API_BASE_URL}/list/filtered${query ? `?${query}` : ''}`;






export interface FilterParams {
  status?: string; // live | upcoming | completed
  type?: string;   // created | participated (assumed backend expects these)
  search?: string;
  signal?: AbortSignal;
}

interface BackendAuctionRaw {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  auctionNo?: string;
  auction_no?: string;
  auctionDate?: string;
  auction_date?: string;
  auctionStartTime?: string;
  auction_start_time?: string;
  start_time?: string;
  auctionEndTime?: string;
  auction_end_time?: string;
  end_time?: string | null;
  duration?: number;
  currency?: string;
  auctionDetails?: string;
  auction_details?: string;
  openToAllCompanies?: boolean;
  open_to_all_companies?: boolean;
  preBidOfferAllowed?: boolean;
  pre_bid_offer_allowed?: boolean;
  pre_bid_allowed?: number | boolean; // 1/0 or boolean
  decrementalValue?: number;
  decremental_value?: string; // "50.00"
  startingPrice?: number;
  reservePrice?: number;
  base_price?: string; // "1000.00"
  current_price?: string; // "1000.00"
  userId?: string;
  createdBy?: string;
  created_by?: string;
  status?: string;
  participants?: string[] | number;
  participant_count?: number;
  bid_count?: number;
  has_participated?: number | boolean;
  documents?: any[];
  createdAt?: string;
  updatedAt?: string;
//   auctioneerCompany?: string;
  company_name?: string;
  creator_company?: string;
  creator_name?: string;
  auctioneerAddress?: string;
  auctioneerPhone?: string;
  access_type?: string; // "Open to All" etc.
}

// Detailed backend shape (for /api/auction/:id)
interface BackendAuctionDetailResponse {
  success?: boolean;
  auction?: {
    auction_no?: string;
    status?: string; // LIVE, UPCOMING, COMPLETED
    auctioneer_details?: {
      company_name?: string;
      person_name?: string;
  email?: string;
  company_address?: string;
    };
    auction_information?: {
      auction_date?: string; // e.g. Aug 31, 2025
      start_time?: string;   // HH:MM:SS
      duration?: string;     // "60 minutes"
      currency?: string;     // INR
      open_to_all?: string;  // Yes/No
      pre_bid_allowed?: string; // Yes/No
      decremental_value?: string; // "INR 100.00"
      base_price?: string;       // "INR 10000.00"
      current_price?: string;    // "INR 10.00"
    };
    description?: string;
    participants?: {
      total?: number;
      list?: Array<{
        id: number;
        auction_id: number;
        user_id: number | null;
        phone_number: string;
        status: string; // invited / joined
        invited_at?: string;
        joined_at?: string | null;
        company_name?: string | null;
        person_name?: string | null;
      }>;
    };
    bid_history?: Array<{
      id: number;
      auction_id: number;
      user_id: number;
      amount: string; // "10.00"
      bid_time: string;
      is_winning: 0 | 1;
      company_name?: string;
      person_name?: string;
    }>;
    documents?: Array<{
      id: number;
      auction_id: number;
      file_name: string;
      file_path: string;
      file_type?: string;
      uploaded_at?: string;
    }>;
  };
  message?: string;
}

export interface AuctionDetail extends BaseAuction {
  backend?: {
    basePrice?: number;
    currentPrice?: number;
    decrementalValueRaw?: string;
    bidHistory?: BackendAuctionDetailResponse['auction'] extends infer A
      ? A extends { bid_history?: any } ? A['bid_history'] : undefined
      : undefined;
    participantsList?: BackendAuctionDetailResponse['auction'] extends infer A
      ? A extends { participants?: infer P }
        ? P extends { list?: any[] } ? P['list'] : undefined
        : undefined
      : undefined;
  auctioneerPerson?: string;
  auctioneerEmail?: string;
  auctioneerAddress?: string;
  }
}

interface BackendResponse {
  success?: boolean;
  message?: string;
  data?: BackendAuctionRaw[] | { auctions?: BackendAuctionRaw[] };
  auctions?: BackendAuctionRaw[]; // in case API returns directly
}

// Map raw backend auction object to BaseAuction used in frontend
function mapAuction(raw: BackendAuctionRaw): BaseAuction {
  // Prefer stable backend-provided identifier; keep a separate backendId in case frontend logic generates synthetic IDs.
  const backendIdRaw = (raw.id ?? raw._id) as any;
  const id = String(backendIdRaw ?? crypto.randomUUID());
  const backendId = backendIdRaw != null ? String(backendIdRaw) : undefined;
  const auctionNo = raw.auctionNo || raw.auction_no || ('AUC-' + id.slice(-6));
  const auctionDate = String(
    raw.auctionDate || raw.auction_date || new Date().toISOString().split('T')[0]
  ).substring(0, 10);
  const startTimeRaw = String(raw.auctionStartTime || raw.auction_start_time || raw.start_time || '09:00');
  const endTimeRaw = raw.auctionEndTime || raw.auction_end_time || (raw.end_time ?? undefined);
  const startTime = startTimeRaw.slice(0,5);
  const endTime = (endTimeRaw ? String(endTimeRaw) : '10:00').slice(0,5);
  // Duration: backend may send huge number (seconds). If > 1440 and divisible by 60 treat as seconds -> minutes.
  let duration = raw.duration;
  if (typeof duration === 'number' && duration > 1440 && duration % 60 === 0) {
    duration = duration / 60; // convert seconds to minutes
  }
  if (!duration) duration = calcDurationMinutes(startTime, endTime) || 60;
  const currency = (raw.currency === 'USD' ? 'USD' : 'INR');
  let participantsArray: string[] = [];
  if (Array.isArray(raw.participants)) participantsArray = raw.participants as string[];
  else if (typeof raw.participants === 'number') participantsArray = Array(raw.participants).fill('');
  else if (typeof raw.participant_count === 'number') participantsArray = Array(raw.participant_count).fill('');

    // Normalize status (backend may return uppercase like LIVE / COMPLETED)
    let status: BaseAuction['status'] = 'upcoming';
    const rawStatus = (raw.status || '').toString().toLowerCase();
    if (rawStatus === 'live') status = 'live';
    else if (rawStatus === 'completed' || rawStatus === 'closed') status = 'completed';

  // Monetary parsing helpers
  const moneyToNum = (v?: string | number) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    const cleaned = v.replace(/[^0-9.]/g,'');
    return cleaned ? parseFloat(cleaned) : undefined;
  };
  const decrementalValueNum = raw.decrementalValue ?? moneyToNum(raw.decremental_value);
  const startingPriceNum = raw.startingPrice ?? moneyToNum(raw.base_price);
  const reservePriceNum = raw.reservePrice ?? moneyToNum(raw.current_price);

  const preBidAllowed = ((): boolean => {
    if (typeof raw.preBidOfferAllowed === 'boolean') return raw.preBidOfferAllowed;
    if (typeof raw.pre_bid_offer_allowed === 'boolean') return raw.pre_bid_offer_allowed;
    if (typeof raw.pre_bid_allowed === 'boolean') return raw.pre_bid_allowed;
    if (typeof raw.pre_bid_offer_allowed === 'number') return raw.pre_bid_offer_allowed === 1;
    if (typeof raw.pre_bid_allowed === 'number') return raw.pre_bid_allowed === 1;
    return false;
  })();

  const openToAll = (() => {
    if (typeof raw.openToAllCompanies === 'boolean') return raw.openToAllCompanies;
    if (typeof raw.open_to_all_companies === 'boolean') return raw.open_to_all_companies;
    if (raw.access_type) return /open/i.test(raw.access_type);
    return true;
  })();

  return {
  id,
  backendId,
    title: raw.title || raw.description?.split('\n')[0] || 'Untitled Auction',
    auctionNo,
  auctionDate,
  rawAuctionDate: raw.auction_date,
    auctionStartTime: startTime,
    auctionEndTime: endTime,
    duration,
    currency,
    auctionDetails: raw.auctionDetails || raw.auction_details || raw.description || 'No details provided',
    openToAllCompanies: openToAll,
    preBidOfferAllowed: preBidAllowed,
    decrementalValue: decrementalValueNum,
    startingPrice: startingPriceNum,
    reservePrice: reservePriceNum,
    userId: raw.userId || raw.createdBy || raw.created_by,
    // auctioneerCompany: raw.auctioneerCompany,
    auctioneerCompany: raw.company_name || raw.creator_company,
    auctioneerAddress: raw.auctioneerAddress,
    auctioneerPhone: raw.auctioneerPhone,
    status,
    participants: participantsArray,
  documents: (Array.isArray(raw.documents) ? raw.documents : []).map((d, i) => ({
      id: (d && (d.id || d._id)) || `${id}-doc-${i}`,
      name: d?.name || d?.fileName || `Document ${i+1}`,
      url: d?.url || '#',
      size: d?.size ? String(d.size) : '0',
      uploadedAt: d?.uploadedAt || new Date().toISOString()
    })),
    createdBy: raw.createdBy || raw.created_by || raw.userId || 'unknown',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
  };
}

function calcDurationMinutes(start: string, end: string): number | undefined {
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (!isFinite(startMin) || !isFinite(endMin)) return undefined;
    let diff = endMin - startMin;
    if (diff <= 0) diff += 24 * 60; // wrap
    return diff;
  } catch {
    return undefined;
  }
}

export async function fetchFilteredAuctions(params: FilterParams): Promise<BaseAuction[]> {
  // Build cache key early (do not include AbortSignal object)
  const cacheKey = `filtered|${params.status || 'all'}|${params.type || 'none'}|${(params.search||'').trim().toLowerCase()}`;
  if (!params.signal && !navigatorOnSlowConnection()) {
    const cached = getCache(cacheKey);
    if (cached) {
      if (typeof console !== 'undefined') console.debug('[apiAuctionService] cache hit filtered', cacheKey, cached.length);
      return cached.slice(); // shallow copy to avoid accidental mutation
    }
  }
  const searchParams = new URLSearchParams();
  // Only send status if a specific one is chosen
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search.trim());

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/list/filtered${query ? `?${query}` : ''}`;
  if (typeof console !== 'undefined') {
    console.debug('[apiAuctionService] fetchFilteredAuctions -> params', params, 'url', url);
  }

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (typeof console !== 'undefined') {
      console.debug('[apiAuctionService] Using auth token for user-specific filtering');
    }
  } else {
    if (typeof console !== 'undefined') {
      console.warn('[apiAuctionService] No auth token found - results may not be user-specific');
    }
  }
  // Helper to perform fetch & parse
  const doFetch = async (attemptUrl: string, note: string) => {
    const started = performance.now?.() || Date.now();
    const res = await fetch(attemptUrl, { signal: params.signal, headers });
    const elapsed = (performance.now?.() || Date.now()) - started;
    if (!res.ok) {
      const text = await res.text().catch(()=> '');
      throw new Error(`Failed to fetch auctions (${res.status}) ${note} ${text ? '- ' + text.slice(0,120) : ''}`);
    }
    const body: BackendResponse = await res.json();
    if (body && (body as any).success === false) {
      const msg = (body as any).message || 'Backend returned success:false';
      // Treat auth / permission messages distinctly
      if (/access token/i.test(msg)) {
        throw new Error('Authentication required. Please log in again.');
      }
      throw new Error(msg);
    }
    const rawList = Array.isArray(body.data)
      ? body.data
      : (Array.isArray(body.auctions) ? body.auctions : (body.data && Array.isArray((body.data as any).auctions) ? (body.data as any).auctions : []));
    if (typeof console !== 'undefined') {
      console.debug('[apiAuctionService] fetchFilteredAuctions response', { note, count: rawList.length, elapsedMs: Math.round(elapsed) });
      if (rawList.length === 0) {
        console.debug('[apiAuctionService] raw backend body (empty list case)', body);
      }
    }
    return rawList;
  };

  let rawList: any[] = [];
  try {
    rawList = await doFetch(url, 'primary');
  } catch (primaryErr: any) {
    // Backend sometimes returns 500 on the aggregate endpoint. Try segmented status fallbacks and merge.
    if (typeof console !== 'undefined') console.warn('[apiAuctionService] fetchFilteredAuctions primary failed, attempting segmented fallback', primaryErr?.message || primaryErr);
    
    const statusesToTry = (params.status && params.status !== 'all')
      ? [params.status, params.status.toUpperCase()].filter((v, i, a) => !!v && a.indexOf(v) === i)
      : ['upcoming', 'live', 'completed', 'UPCOMING', 'LIVE', 'COMPLETED'];
    
    const seen = new Set<string>();
    const merged: any[] = [];
    
    for (const st of statusesToTry) {
      const sp = new URLSearchParams();
      sp.set('status', st);
      if (params.type) sp.set('type', params.type);
      if (params.search) sp.set('search', params.search.trim());
      const segUrl = `${API_BASE_URL}/list/filtered?${sp.toString()}`;
      try {
        const segList = await doFetch(segUrl, `seg-${st}`);
        for (const item of segList) {
          const key = String((item && (item.id || item._id || item.auction_no)) || JSON.stringify(item).slice(0,80));
          if (!seen.has(key)) { seen.add(key); merged.push(item); }
        }
      } catch (segErr) {
        if (typeof console !== 'undefined') console.warn('[apiAuctionService] segmented fetch failed for', st, (segErr as any)?.message || segErr);
      }
    }
    
    // If still empty and we originally set a type, try again without the type filter
    if (merged.length === 0 && params.type) {
      for (const st of statusesToTry) {
        const sp = new URLSearchParams();
        sp.set('status', st);
        if (params.search) sp.set('search', params.search.trim());
        const segUrl = `${API_BASE_URL}/list/filtered?${sp.toString()}`;
        try {
          const segList = await doFetch(segUrl, `seg-no-type-${st}`);
          for (const item of segList) {
            const key = String((item && (item.id || item._id || item.auction_no)) || JSON.stringify(item).slice(0,80));
            if (!seen.has(key)) { seen.add(key); merged.push(item); }
          }
        } catch (segErr) {
          if (typeof console !== 'undefined') console.warn('[apiAuctionService] segmented (no-type) fetch failed for', st, (segErr as any)?.message || segErr);
        }
      }
    }
    
    rawList = merged;
    if (!rawList || rawList.length === 0) {
      // New fallback: try without status (server bug: timeString.split on some statuses)
      try {
        const spNoStatus = new URLSearchParams();
        if (params.type) spNoStatus.set('type', params.type);
        if (params.search) spNoStatus.set('search', params.search.trim());
        const noStatusUrl = `${API_BASE_URL}/list/filtered${spNoStatus.toString() ? `?${spNoStatus.toString()}` : ''}`;
        const noStatusList = await doFetch(noStatusUrl, 'no-status-fallback');
        if (Array.isArray(noStatusList) && noStatusList.length > 0) {
          if (typeof console !== 'undefined') console.warn('[apiAuctionService] no-status fallback succeeded with', noStatusList.length, 'items');
          rawList = noStatusList;
        }
      } catch (noStatusErr) {
        if (typeof console !== 'undefined') console.warn('[apiAuctionService] no-status fallback failed', (noStatusErr as any)?.message || noStatusErr);
      }

      // Last resort: try with neither status nor type (broad fetch) and let client filter
      if (!rawList || rawList.length === 0) {
        try {
          const spBare = new URLSearchParams();
          if (params.search) spBare.set('search', params.search.trim());
          const bareUrl = `${API_BASE_URL}/list/filtered${spBare.toString() ? `?${spBare.toString()}` : ''}`;
          const bareList = await doFetch(bareUrl, 'bare-fallback');
          if (Array.isArray(bareList) && bareList.length > 0) {
            if (typeof console !== 'undefined') console.warn('[apiAuctionService] bare fallback succeeded with', bareList.length, 'items');
            rawList = bareList;
          }
        } catch (bareErr) {
          if (typeof console !== 'undefined') console.warn('[apiAuctionService] bare fallback failed', (bareErr as any)?.message || bareErr);
        }
      }

      // If absolutely nothing worked, rethrow the original error to preserve semantics
      if (!rawList || rawList.length === 0) throw primaryErr;
    }
  }

  // If we requested a specific status in lowercase and got zero, retry with uppercase (some backends expect uppercase enums)
  if ((params.status && params.status !== 'all') && rawList.length === 0) {
    const originalStatus = params.status;
    const upper = originalStatus.toUpperCase();
    if (upper !== originalStatus) {
      const retryParams = new URLSearchParams();
      retryParams.set('status', upper);
      if (params.type) retryParams.set('type', params.type);
      if (params.search) retryParams.set('search', params.search.trim());
      const retryUrl = `${API_BASE_URL}/list/filtered?${retryParams.toString()}`;
      try {
        const retryList = await doFetch(retryUrl, 'uppercase-fallback');
        if (retryList.length > 0) {
          rawList = retryList;
        }
      } catch (e) {
        // swallow fallback error, primary error path already covered
        if (typeof console !== 'undefined') console.warn('[apiAuctionService] uppercase fallback failed', e);
      }
    }
  }

  // As a diagnostic, if still empty and status provided, log a hint
  if (rawList.length === 0 && params.status && params.status !== 'all') {
    if (typeof console !== 'undefined') {
      console.info('[apiAuctionService] No auctions returned for status', params.status, 'type', params.type, 'search', params.search || '(empty)');
    }
  }

  // If still empty and a type filter was applied, retry without the type constraint (backend may ignore or use different param)
  if (rawList.length === 0 && params.type) {
    const retryParams = new URLSearchParams();
    if (params.status && params.status !== 'all') retryParams.set('status', params.status);
    if (params.search) retryParams.set('search', params.search.trim());
    const retryUrl = `${API_BASE_URL}/list/filtered?${retryParams.toString()}`;
    try {
      const altList = await doFetch(retryUrl, 'no-type-fallback');
      if (altList.length > 0) rawList = altList;
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[apiAuctionService] no-type fallback failed', e);
    }
  }

  // If backend returns a participation hint, apply it when the caller asked for participated auctions
  if (rawList && rawList.length && params.type === 'participated') {
    const before = rawList.length;
    const filtered = rawList.filter((it: any) => {
      const v = it?.has_participated ?? it?.participated ?? it?.is_participant;
      return v === true || v === 1 || v === '1' || (typeof v === 'string' && v.toLowerCase() === 'true');
    });
    if (filtered.length > 0) {
      if (typeof console !== 'undefined') console.debug('[apiAuctionService] Applied has_participated filter', { before, after: filtered.length });
      rawList = filtered;
    }
  }

  const safeList = Array.isArray(rawList) ? rawList : [];
  const mapped = safeList.map(mapAuction);
  setCache(cacheKey, mapped);
  return mapped;
}

export async function fetchAuctionById(id: string, signal?: AbortSignal): Promise<AuctionDetail> {
  id = String(id);
  console.log('[apiAuctionService] fetchAuctionById called with ID:', id);
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  console.log('[apiAuctionService] Auth token present:', !!token);
  const primaryUrl = `${API_BASE_URL}/${id}`;
  console.log('[apiAuctionService] Fetching from URL:', primaryUrl);
  let res = await fetch(primaryUrl, { signal, headers });
  console.log('[apiAuctionService] Response status:', res.status);
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    console.error('[apiAuctionService] Fetch failed:', res.status, text.substring(0, 200));
    
    // Fallback: try to find auction in list when direct detail fails
    // Now includes 403 (Forbidden) to allow limited, non-sensitive info rendering for participants
    if ((res.status === 404 || res.status === 403 || res.status >= 500) && id) {
      try {
        console.warn('[apiAuctionService] Attempting fallback via fetchFilteredAuctions for id', id);
        const statuses = ['all', 'live', 'upcoming', 'completed'];
        for (const status of statuses) {
          try {
            const list = await fetchFilteredAuctions({ status });
            const targetNumeric = id.replace(/\D/g,'');
            const match = list.find(a => 
              a.id === id || 
              (a as any).backendId === id || 
              a.auctionNo === id ||
              (targetNumeric && a.auctionNo.replace(/\D/g,'') === targetNumeric)
            );
            if (match) {
              console.warn('[apiAuctionService] Fallback found auction via list, synthesizing detail');
              const detail: AuctionDetail = {
                ...match,
                backend: {
                  basePrice: match.startingPrice,
                  currentPrice: match.reservePrice,
                  decrementalValueRaw: match.decrementalValue?.toString(),
                  bidHistory: undefined,
                  participantsList: undefined,
                  auctioneerPerson: undefined,
                  auctioneerEmail: undefined,
                  auctioneerAddress: match.auctioneerAddress
                }
              };
              return detail;
            }
          } catch {}
        }
        // As an extra attempt, try user-scoped my-auctions endpoint (often permission-safe)
        try {
          const mine = await fetchMyAuctions('all');
          const targetNumeric = id.replace(/\D/g,'');
          const match = mine.find(a => 
            a.id === id ||
            (a as any).backendId === id ||
            a.auctionNo === id ||
            (targetNumeric && a.auctionNo.replace(/\D/g,'') === targetNumeric)
          );
          if (match) {
            console.warn('[apiAuctionService] Fallback found auction via my-auctions, synthesizing detail');
            const detail: AuctionDetail = {
              ...match,
              backend: {
                basePrice: match.startingPrice,
                currentPrice: match.reservePrice,
                decrementalValueRaw: match.decrementalValue?.toString(),
                bidHistory: undefined,
                participantsList: undefined,
                auctioneerPerson: undefined,
                auctioneerEmail: undefined,
                auctioneerAddress: match.auctioneerAddress
              }
            };
            return detail;
          }
        } catch (mineErr) {
          if (typeof console !== 'undefined') console.warn('[apiAuctionService] my-auctions fallback failed', mineErr);
        }
      } catch (fallbackErr) {
        console.warn('[apiAuctionService] Fallback attempt failed', fallbackErr);
      }
    }
    
    if (res.status === 404) {
      if (typeof console !== 'undefined') console.warn('[apiAuctionService] 404 for auction id', id, text.slice(0,120));
    }
    throw new Error(`Failed to fetch auction ${id} (${res.status}) ${text ? '- ' + text.slice(0,120) : ''}`);
  }
  const body: BackendAuctionDetailResponse = await res.json();
  console.log('[apiAuctionService] Auction detail response:', body);
  const a = body.auction;
  if (!a) throw new Error('Auction detail missing in response');

  // Parse date -> YYYY-MM-DD
  let auctionDateISO = new Date().toISOString().split('T')[0];
  if (a.auction_information?.auction_date) {
    const parsed = new Date(a.auction_information.auction_date);
    if (!isNaN(parsed.getTime())) auctionDateISO = parsed.toISOString().substring(0,10);
  }
  const startTimeRaw = String(a.auction_information?.start_time || '09:00:00');
  const startTime = startTimeRaw.slice(0,5);
  const durationMinutes = (() => {
    const d = a.auction_information?.duration || '';
    const m = d.match(/(\d+)/);
    return m ? parseInt(m[1],10) : 60;
  })();
  // Derive end time from start time + duration (minutes)
  const derivedEndTime = (() => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      if (!isFinite(sh) || !isFinite(sm)) return '';
      const total = (sh * 60 + sm + durationMinutes) % (24*60);
      const eh = Math.floor(total / 60);
      const em = total % 60;
      return `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
    } catch { return ''; }
  })();
  const decRaw = String(a.auction_information?.decremental_value || '');
  const basePriceRaw = String(a.auction_information?.base_price || '');
  const currentPriceRaw = String(a.auction_information?.current_price || '');
  const numFromMoney = (s: string) => {
    const m = s.replace(/[^0-9.]/g,'');
    return m ? parseFloat(m) : undefined;
  };
  const decrementalValNum = numFromMoney(decRaw);
  const basePriceNum = numFromMoney(basePriceRaw);
  const currentPriceNum = numFromMoney(currentPriceRaw);

  const statusLower = (a.status || '').toLowerCase();
  let status: BaseAuction['status'] = 'upcoming';
  if (statusLower === 'live') status = 'live';
  else if (statusLower === 'completed') status = 'completed';

  const baseAuction: AuctionDetail = {
    id: id,
    title: a.description?.split('\n')[0] || a.auction_no || 'Auction',
    auctionNo: a.auction_no || 'AUC-' + id,
  auctionDate: auctionDateISO,
  rawAuctionDate: a.auction_information?.auction_date,
    auctionStartTime: startTime,
  auctionEndTime: derivedEndTime,
    duration: durationMinutes,
    currency: (a.auction_information?.currency === 'USD' ? 'USD' : 'INR'),
    auctionDetails: a.description || 'No details',
    openToAllCompanies: a.auction_information?.open_to_all?.toLowerCase() === 'yes',
    preBidOfferAllowed: a.auction_information?.pre_bid_allowed?.toLowerCase() === 'yes',
    decrementalValue: decrementalValNum,
    startingPrice: basePriceNum,
    reservePrice: currentPriceNum,
    userId: undefined,
  auctioneerCompany: a.auctioneer_details?.company_name,
  auctioneerAddress: a.auctioneer_details?.company_address,
    auctioneerPhone: undefined,
    status,
    participants: (Array.isArray(a.participants?.list) ? a.participants!.list! : []).map(p => p.phone_number),
    documents: (Array.isArray(a.documents) ? a.documents : []).map((d,i)=>({
      id: String(d.id || i),
      name: d.file_name,
      url: String(d.file_path || '').startsWith('http') ? d.file_path : `${location.origin}/${d.file_path}`,
      size: d.file_type || '',
      uploadedAt: d.uploaded_at || new Date().toISOString()
    })),
  // Use auctioneer company name as a synthetic createdBy identifier so UI can resolve a pseudo user
  createdBy: a.auctioneer_details?.company_name || 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    backend: {
      basePrice: basePriceNum,
      currentPrice: currentPriceNum,
      decrementalValueRaw: decRaw,
    bidHistory: Array.isArray(a.bid_history) ? a.bid_history : undefined,
  participantsList: Array.isArray(a.participants?.list) ? a.participants!.list! : undefined,
  auctioneerPerson: a.auctioneer_details?.person_name,
  auctioneerEmail: a.auctioneer_details?.email,
  auctioneerAddress: a.auctioneer_details?.company_address
    }
  };
  return baseAuction;
}

// Fetch "my auctions" (auctions related to the authenticated user) filtered by optional status
// status can be upcoming | live | completed (omit or use 'all' to fetch all)
export async function fetchMyAuctions(status?: string, signal?: AbortSignal): Promise<BaseAuction[]> {
  const cacheKey = `mine|${status || 'all'}`;
  if (!signal && !navigatorOnSlowConnection()) {
    const cached = getCache(cacheKey);
    if (cached) {
      if (typeof console !== 'undefined') console.debug('[apiAuctionService] cache hit my-auctions', cacheKey, cached.length);
      return cached.slice();
    }
  }
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    if (typeof console !== 'undefined') {
      console.warn('[apiAuctionService] fetchMyAuctions: No auth token found - cannot fetch user-specific auctions');
    }
    throw new Error('Authentication required to fetch your auctions');
  }
  const normalizedStatus = status && status !== 'all' ? status : undefined;
  const url = `${API_BASE_URL}/my-auctions${normalizedStatus ? `?status=${encodeURIComponent(normalizedStatus)}` : ''}`;
  if (typeof console !== 'undefined') console.debug('[apiAuctionService] fetchMyAuctions url', url, 'for user-created auctions only');
  const res = await fetch(url, { signal, headers });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`Failed to fetch my auctions (${res.status}) ${text ? '- ' + text.slice(0,120) : ''}`);
  }
  let body: any;
  try { body = await res.json(); } catch { body = null; }
  if (body && body.success === false) {
    throw new Error(body.message || 'Backend returned success:false');
  }
  // Accept multiple possible shapes: {auctions: []}, {data: []}, [], {data: {auctions: []}}
  const rawList: any[] = Array.isArray(body)
    ? body
    : (Array.isArray(body?.auctions)
        ? body.auctions
        : (Array.isArray(body?.data)
            ? body.data
            : (Array.isArray(body?.data?.auctions) ? body.data.auctions : [])));
  if (rawList.length === 0 && normalizedStatus && normalizedStatus !== normalizedStatus.toUpperCase()) {
    // Retry uppercase variant if empty (backend might expect uppercase enums)
    const upper = normalizedStatus.toUpperCase();
    const retryUrl = `${API_BASE_URL}/my-auctions?status=${encodeURIComponent(upper)}`;
    try {
      const retryRes = await fetch(retryUrl, { signal, headers });
      if (retryRes.ok) {
        const retryBody: any = await retryRes.json().catch(()=>null);
        const retryList: any[] = Array.isArray(retryBody)
          ? retryBody
          : (Array.isArray(retryBody?.auctions)
              ? retryBody.auctions
              : (Array.isArray(retryBody?.data)
                  ? retryBody.data
                  : (Array.isArray(retryBody?.data?.auctions) ? retryBody.data.auctions : [])));
        if (retryList.length > 0) return retryList.map(mapAuction);
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[apiAuctionService] fetchMyAuctions uppercase retry failed', e);
    }
  }
  const mapped = rawList.map(mapAuction);
  setCache(cacheKey, mapped);
  return mapped;
}

// Join auction as auctioneer (important API per requirements)
export async function joinAuctioneer(auctionId: string): Promise<{ success: boolean; message?: string; [k: string]: any; }> {
  if (!auctionId) throw new Error('auctionId required');
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');
  const url = `${API_BASE_URL}/${auctionId}/join-auctioneer`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json.message || `Failed to join auction as auctioneer (${res.status})`);
  return json;
}

// Join auction as participant. Backend naming is assumed "join-participant"; falls back to generic "join" if 404.
export async function joinParticipant(auctionId: string): Promise<{ success: boolean; message?: string; [k: string]: any; }> {
  if (!auctionId) throw new Error('auctionId required');
  const token = localStorage.getItem('authToken');
  console.log('[apiAuctionService] joinParticipant called with ID:', auctionId);
  console.log('[apiAuctionService] Auth token present:', !!token, token?.substring(0, 20) + '...');
  if (!token) throw new Error('Authentication required');
  const attempt = async (path: string) => {
    const url = `${API_BASE_URL}/${auctionId}/${path}`;
    console.log('[apiAuctionService] Attempting POST to:', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    const text = await res.text();
    console.log('[apiAuctionService] Response status:', res.status, 'text:', text.substring(0, 200));
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { res, json };
  };
  // First try explicit participant endpoint
  let { res, json } = await attempt('join-participant');
  if (res.status === 404) {
    console.log('[apiAuctionService] join-participant 404, trying generic join');
    // Fallback to generic join
    ({ res, json } = await attempt('join'));
  }
  if (!res.ok) {
    console.error('[apiAuctionService] Join failed with status:', res.status, 'json:', json);
    // Treat already joined / duplicate join as non-fatal success for smoother UX
    if (res.status === 400 || res.status === 409) {
      if (/already/i.test(json.message || '')) {
        return { success: true, message: json.message };
      }
    }
    throw new Error(json.message || `Failed to join auction as participant (${res.status})`);
  }
  if (json && json.success === false) {
    // Some backends use success:false with 200
    if (/already/i.test(json.message || '')) return { success: true, message: json.message };
    throw new Error(json.message || 'Failed to join auction');
  }
  console.log('[apiAuctionService] Join successful:', json);
  return json || { success: true };
}

// Fetch participants for an auction
export async function fetchParticipants(auctionId: string, signal?: AbortSignal): Promise<{ total?: number; participants: any[]; }>{
  if (!auctionId) throw new Error('auctionId required');
  const token = localStorage.getItem('authToken');
  const headers: Record<string,string> = { 'Accept':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${API_BASE_URL}/${auctionId}/participants`;
  const res = await fetch(url, { signal, headers });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json.message || `Failed to fetch participants (${res.status})`);
  const list = json.participants || json.data || json.list || json.users || [];
  const total = json.total || (json.meta && json.meta.total) || list.length;
  return { total, participants: Array.isArray(list) ? list : [] };
}

// Download auction report (completed auctions)
export async function downloadAuctionReport(auctionId: string): Promise<Blob> {
  if (!auctionId) throw new Error('auctionId required');
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Authentication required');
  const url = `${API_BASE_URL}/${auctionId}/report`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf,application/json' } });
  if (!res.ok) {
    // Attempt to parse error json
    let msg = `Failed to download report (${res.status})`;
    try { const j = await res.json(); if (j.message) msg = j.message; } catch {}
    throw new Error(msg);
  }
  return await res.blob();
}

// Fetch auction timers (backend real-time reference) - for potential synchronization/poll fallback
const TIMERS_ENDPOINT = 'https://auction-development.onrender.com/api/my-auctions/timers';
export async function fetchAuctionTimers(signal?: AbortSignal): Promise<any> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string,string> = { 'Accept':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(TIMERS_ENDPOINT, { signal, headers });
  const json = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(json.message || `Failed to fetch auction timers (${res.status})`);
  return json;
}

export default {
  fetchFilteredAuctions,
  fetchAuctionById,
  fetchMyAuctions,
  joinAuctioneer,
  joinParticipant,
  fetchParticipants,
  downloadAuctionReport,
  fetchAuctionTimers
};

// ----------------- Helpers -----------------
function navigatorOnSlowConnection(): boolean {
  try {
    const nav = (navigator as any);
    const effective = nav?.connection?.effectiveType; // 2g | 3g | 4g | slow-2g
    if (effective && /(^|-)2g/.test(effective)) return true;
    return false;
  } catch {
    return false;
  }
}

























// Admin Auction Service integrating real backend endpoints.
// Endpoints provided:
//  GET    /api/admin/auctions?search=&status=&page=&limit=
//  GET    /api/admin/auctions/:id
//  PUT    /api/admin/auctions/:id/status              (body { status })
//  PUT    /api/admin/auctions/:auctionId/participants/:participantId/status (body { status })
//  DELETE /api/admin/auctions/:id
// Notes:
//  - Token precedence: sessionStorage.adminToken -> any sessionStorage key starting 'admin_token' -> localStorage.authToken
//  - Defensive parsing of response shapes (data nesting / direct arrays / field name variations)

const ADMIN_AUCTIONS_BASE = 'https://auction-development.onrender.com/api/admin/auctions';

export interface RawAuctionParticipant {
  id?: string; _id?: string; participant_id?: string;
  name?: string; person_name?: string;
  company?: string; company_name?: string;
  phone?: string; phone_number?: string;
  status?: string;
  [k: string]: any;
}

export interface NormalizedAuctionParticipant {
  id: string;
  name: string;
  company: string;
  phone: string;
  status: string;
}

export interface RawAuctionRecord {
  id?: string; _id?: string; auction_id?: string;
  title?: string; auction_title?: string;
  description?: string; details?: string; auctionDetails?: string;
  companyName?: string; company_name?: string; auctioneerCompany?: string;
  auctioneerName?: string; auctioneer_name?: string; auctioneer?: string;
  auctioneerPhone?: string; auctioneer_phone?: string; phone?: string;
  category?: string;
  basePrice?: number; starting_price?: number; startingPrice?: number;
  currentBid?: number; current_bid?: number;
  status?: string;
  startDate?: string; auctionDate?: string; start_date?: string;
  startTime?: string; auctionStartTime?: string; start_time?: string;
  endDate?: string; end_date?: string;
  endTime?: string; auctionEndTime?: string; end_time?: string;
  autoExtension?: boolean; auto_extension?: boolean;
  extensionTime?: number; extension_time?: number;
  decrementalValue?: number; decremental_value?: number;
  location?: string; address?: string;
  city?: string; state?: string; pincode?: string;
  participants?: RawAuctionParticipant[]; auction_participants?: RawAuctionParticipant[];
  documents?: string[]; images?: string[];
  termsAndConditions?: string; terms?: string;
  createdAt?: string; created_at?: string;
  updatedAt?: string; updated_at?: string; lastModified?: string;
  adminNotes?: string; rejectionReason?: string; rejection_reason?: string;
  [k: string]: any;
}

export interface NormalizedAuctionRecord {
  id: string;
  title: string;
  description: string;
  companyName: string;
  auctioneerName: string;
  auctioneer_phone: string;
  category: string;
  basePrice: number;
  currentBid: number;
  status: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  autoExtension: boolean;
  extensionTime: number;
  decrementalValue: number;
  location: string;
  city: string;
  state: string;
  pincode: string;
  participants: NormalizedAuctionParticipant[];
  documents: string[];
  images: string[];
  termsAndConditions: string;
  createdAt: string;
  lastModified: string;
  adminNotes?: string;
  rejectionReason?: string;
  // Correctly define the new fields from the backend
  total_participants?: number;
  joined_participants?: number;
  invited_participants?: number;
  declined_participants?: number;
}

class AdminAuctionService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    let adminToken: string | null = null;
    try {
      adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (k.startsWith('admin_token')) { adminToken = sessionStorage.getItem(k); break; }
        }
      }
    } catch { /* ignore */ }
    const authToken = token || adminToken || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  private normalizeParticipant(p: RawAuctionParticipant): NormalizedAuctionParticipant {
    return {
      id: String(p.id || p._id || p.participant_id || ''),
      name: p.name || p.person_name || 'Unknown',
      company: p.company || p.company_name || '—',
      phone: p.phone || p.phone_number || '—',
      status: p.status || 'pending',
    };
  }

  private normalizeAuction(raw: RawAuctionRecord): NormalizedAuctionRecord {
    const participantsRaw: RawAuctionParticipant[] = raw.participants || raw.auction_participants || [];
    const docsRaw: any[] = (raw.documents as any[]) || [];
    const documents: string[] = docsRaw.map(d => {
      if (typeof d === 'string') return d;
      if (d && typeof d === 'object') {
        return d.file_name || d.name || d.file_path || 'Document';
      }
      return 'Document';
    });

    // Calculate the end date and time based on duration
    let calculatedEndDate = 'N/A';
    let calculatedEndTime = 'N/A';

    const startISOString = raw.auction_date || raw.startDate || raw.start_date;
    const rawStartTime = raw.startTime || raw.start_time || '';

    let startDateTime: Date | null = null;

    if (startISOString && rawStartTime) {
      try {
        // Extract date parts
        const [year, month, day] = startISOString.split('T')[0].split('-').map(Number);
        // Extract time parts
        const [hour, minute, second] = rawStartTime.split(':').map(Number);

        // Manually construct the Date object with local time
        // Note: Month is 0-indexed in JS Date object (January is 0)
        startDateTime = new Date(year, month - 1, day, hour, minute, second);
      } catch (e) {
        console.error("Failed to parse date/time components:", e);
        startDateTime = null; // Set to null if parsing fails
      }
    }

    if (startDateTime && raw.duration) {
      const endDateTime = new Date(startDateTime.getTime() + raw.duration * 1000); // Duration is in seconds
      calculatedEndDate = endDateTime.toLocaleDateString('en-GB'); // dd/mm/yyyy format
      calculatedEndTime = endDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    const startDate = startDateTime ? startDateTime.toLocaleDateString('en-GB') : 'N/A';
    const startTime = startDateTime ? startDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) : 'N/A';

    return {
      id: String(raw.id || raw._id || raw.auction_id || ''),
      title: raw.title || raw.auction_title || 'Untitled Auction',
      description: raw.description || raw.details || raw.auctionDetails || '',
      companyName: raw.companyName || raw.company_name || raw.auctioneerCompany || '—',
      auctioneerName: raw.auctioneerName || raw.auctioneer_name || raw.auctioneer || '—',
      auctioneer_phone: raw.auctioneerPhone || raw.auctioneer_phone || raw.phone || '—',
      category: raw.category || 'general',
      basePrice: Number(raw.basePrice ?? raw.starting_price ?? raw.startingPrice ?? 0),
      currentBid: Number(raw.currentBid ?? raw.current_bid ?? 0),
      status: raw.status || 'draft',
      startDate,
      startTime,
      endDate: calculatedEndDate,
      endTime: calculatedEndTime,
      autoExtension: Boolean(raw.autoExtension ?? raw.auto_extension ?? false),
      extensionTime: Number(raw.extensionTime ?? raw.extension_time ?? 0),
      decrementalValue: Number(raw.decrementalValue ?? raw.decremental_value ?? 0),
      location: raw.location || raw.address || '—',
      city: raw.city || '—',
      state: raw.state || '—',
      pincode: raw.pincode || '—',
      participants: participantsRaw.map(p => this.normalizeParticipant(p)),
      documents,
      images: raw.images || [],
      termsAndConditions: raw.termsAndConditions || raw.terms || '',
      createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
      lastModified: raw.updatedAt || raw.updated_at || raw.lastModified || raw.createdAt || new Date().toISOString(),
      adminNotes: raw.adminNotes,
      rejectionReason: raw.rejectionReason || raw.rejection_reason,
      total_participants: Number(raw.total_participants ?? 0),
      joined_participants: Number(raw.joined_participants ?? 0),
      invited_participants: Number(raw.invited_participants ?? 0),
      declined_participants: Number(raw.declined_participants ?? 0),
    };
  }

  async listAuctions(params: { page?: number; limit?: number; status?: string; search?: string; token?: string } = {}) {
    const { page = 1, limit = 10, status = '', search = '', token } = params;
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(limit));
    if (status && status !== 'all') qs.set('status', status);
    if (search) qs.set('search', search);
    const url = `${ADMIN_AUCTIONS_BASE}?${qs.toString()}`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Failed to fetch auctions (${res.status})`);
    const dataBlock = json.data || json;
    const rawList: RawAuctionRecord[] = dataBlock.auctions || dataBlock.data || [];
    const total = dataBlock.total || dataBlock.totalAuctions || rawList.length || 0;
    return {
      auctions: rawList.map(r => this.normalizeAuction(r)),
      total,
      page: dataBlock.page || page,
      limit: dataBlock.limit || limit,
      raw: json,
    };
  }

  async getAuctionById(id: string, token?: string): Promise<NormalizedAuctionRecord> {
    const res = await fetch(`${ADMIN_AUCTIONS_BASE}/${id}`, { headers: this.getAuthHeaders(token) });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Failed to fetch auction (${res.status})`);
    const raw: RawAuctionRecord = json.data || json.auction || json;
    return this.normalizeAuction(raw);
  }

  /**
   * Update auction status with robust fallbacks (handles differing backend expectations).
   * Accepts optional reason (rejection reason). Backwards compatible parameter pattern:
   * updateAuctionStatus(id, status)
   * updateAuctionStatus(id, status, reason)
   * updateAuctionStatus(id, status, token)  (heuristic if looks like JWT)
   * updateAuctionStatus(id, status, reason, token)
   */
  async updateAuctionStatus(id: string, status: string, reasonOrToken?: string, tokenMaybe?: string): Promise<NormalizedAuctionRecord> {
    let reason: string | undefined; let token: string | undefined;
    if (reasonOrToken && tokenMaybe) { reason = reasonOrToken; token = tokenMaybe; }
    else if (reasonOrToken) {
      // Heuristic: JWT tokens usually contain two dots and are long
      if (reasonOrToken.split('.').length === 3 && reasonOrToken.length > 20) token = reasonOrToken; else reason = reasonOrToken;
    }
    if (!token) token = tokenMaybe; // final fallback

    const url = `${ADMIN_AUCTIONS_BASE}/${id}/status`;
    const headers = this.getAuthHeaders(token);

    const basePayload: any = { status };
    if (reason) basePayload.reason = reason;

    // Generate payload variants (status key variants + reason key variants)
    const statusKeys = ['status', 'auction_status', 'newStatus', 'status_value'];
    const reasonKeys = reason ? ['reason', 'rejectionReason', 'rejection_reason'] : [];
    const payloadVariants: any[] = [];
    statusKeys.forEach(sk => {
      const variant: any = { [sk]: status };
      reasonKeys.forEach(rk => { variant[rk] = reason; });
      payloadVariants.push(variant);
    });
    // Ensure at least the base variant present
    if (payloadVariants.length === 0) payloadVariants.push(basePayload);

    let lastError: any = null;
    const attempt = async (method: string, variant: any, note: string, useBody = true) => {
      try {
        const requestUrl = url + (note.includes('query') ? `?status=${encodeURIComponent(status)}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}` : '');
        const requestBody = useBody ? JSON.stringify(variant) : undefined;
        console.log(`🔍 Auction status update attempt: ${method} ${requestUrl}`);
        console.log(`📤 Headers:`, headers);
        console.log(`📦 Body:`, requestBody);

        const res = await fetch(requestUrl, { method, headers, body: requestBody });
        const text = await res.text();
        console.log(`📥 Response ${res.status}:`, text);

        let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
        if (res.ok) {
          const raw: RawAuctionRecord = json.data || json.auction || json;
          return this.normalizeAuction(raw);
        }
        lastError = new Error(json.message || `${method} ${note} failed (${res.status}): ${text}`);
      } catch (e) { lastError = e; }
      return null;
    };

    // 1. PUT with body variants
    for (let i = 0; i < payloadVariants.length; i++) {
      const result = await attempt('PUT', payloadVariants[i], `variant ${i + 1}`);
      if (result) return result;
    }
    // 2. PATCH with body variants
    for (let i = 0; i < payloadVariants.length; i++) {
      const result = await attempt('PATCH', payloadVariants[i], `patch variant ${i + 1}`);
      if (result) return result;
    }
    // 3. PUT query params only
    const qpResultPut = await attempt('PUT', {}, 'query', false); if (qpResultPut) return qpResultPut;
    // 4. PATCH query params only
    const qpResultPatch = await attempt('PATCH', {}, 'query', false); if (qpResultPatch) return qpResultPatch;

    // 5. Try alternative endpoint patterns (backend might use different path)
    console.log('🔄 Trying alternative endpoints...');
    const altUrls = [
      `${ADMIN_AUCTIONS_BASE}/${id}`, // Direct PATCH to auction
      `${ADMIN_AUCTIONS_BASE}/${id}/update-status`,
      `${ADMIN_AUCTIONS_BASE}/${id}/change-status`,
      `${ADMIN_AUCTIONS_BASE}/status/${id}`, // Different path structure
    ];

    for (const altUrl of altUrls) {
      try {
        console.log(`🧪 Trying alternative endpoint: PUT ${altUrl}`);
        const res = await fetch(altUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify(basePayload),
        });
        const text = await res.text();
        console.log(`📥 Alt response ${res.status}:`, text);

        if (res.ok) {
          let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
          const raw: RawAuctionRecord = json.data || json.auction || json;
          return this.normalizeAuction(raw);
        }
      } catch (e) {
        console.log(`❌ Alt endpoint failed:`, e);
      }
    }

    throw lastError || new Error('Failed to update auction status after all strategies');
  }

  async updateParticipantStatus(auctionId: string, participantId: string, status: string, token?: string): Promise<NormalizedAuctionRecord> {
    const url = `${ADMIN_AUCTIONS_BASE}/${auctionId}/participants/${participantId}/status`;
    const headers = this.getAuthHeaders(token);

    // We'll try multiple payload key variants in case backend expects different naming.
    const payloadVariants = [
      { status },
      { participant_status: status },
      { participantStatus: status },
      { newStatus: status },
      { status_value: status },
    ];
    let lastError: any = null;
    // 1. Try JSON payload variants via PUT
    for (let i = 0; i < payloadVariants.length; i++) {
      try {
        const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payloadVariants[i]) });
        const text = await res.text();
        let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
        if (!res.ok) {
          lastError = new Error(json.message || `PUT variant ${i + 1} failed (${res.status})`);
          if (res.status >= 500 && i < payloadVariants.length - 1) continue; // try next variant
          if (res.status >= 400 && res.status < 500 && i < payloadVariants.length - 1) continue; // try next
          // break out if last or irrecoverable
        } else {
          const raw: RawAuctionRecord = json.data || json.auction || json;
          return this.normalizeAuction(raw);
        }
      } catch (err) { lastError = err; }
    }

    // 2. Try PUT with query param & empty body
    try {
      const qpUrl = `${url}?status=${encodeURIComponent(status)}`;
      const res = await fetch(qpUrl, { method: 'PUT', headers });
      const text = await res.text();
      let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
      if (res.ok) {
        const raw: RawAuctionRecord = json.data || json.auction || json;
        return this.normalizeAuction(raw);
      } else {
        lastError = new Error(json.message || `PUT query param failed (${res.status})`);
      }
    } catch (e) { lastError = e; }

    // 3. Try PATCH with simplest body { status }
    try {
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
      const text = await res.text();
      let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
      if (res.ok) {
        const raw: RawAuctionRecord = json.data || json.auction || json;
        return this.normalizeAuction(raw);
      } else {
        lastError = new Error(json.message || `PATCH failed (${res.status})`);
      }
    } catch (e) { lastError = e; }

    // 4. Try PATCH with no body (some APIs infer from path & query)
    try {
      const qpPatch = `${url}?status=${encodeURIComponent(status)}`;
      const res = await fetch(qpPatch, { method: 'PATCH', headers });
      const text = await res.text();
      let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
      if (res.ok) {
        const raw: RawAuctionRecord = json.data || json.auction || json;
        return this.normalizeAuction(raw);
      } else {
        lastError = new Error(json.message || `PATCH query param failed (${res.status})`);
      }
    } catch (e) { lastError = e; }

    throw lastError || new Error('Failed to update participant status after all strategies');
  }

  async deleteAuction(id: string, token?: string): Promise<boolean> {
    const res = await fetch(`${ADMIN_AUCTIONS_BASE}/${id}`, { method: 'DELETE', headers: this.getAuthHeaders(token) });
    if (res.status === 204) return true;
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Failed to delete auction (${res.status})`);
    return true;
  }
}

export default new AdminAuctionService();
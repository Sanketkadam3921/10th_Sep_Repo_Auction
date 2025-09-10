// Service for Admin Manage Users APIs
// Endpoints:
//  - GET /api/user/admin/users?search=&status=&page=&limit=&sortBy=&sortOrder=
//  - GET /api/user/admin/users/:id
// Assumptions: Backend returns JSON { success, message, data } where data may directly be an array or an object
// with shape { users: [], total, page, limit } (we defensively handle both).

const ADMIN_USERS_BASE_URL = 'https://auction-development.onrender.com/api/user/admin/users';

export interface RawUserRecord {
  id?: string;
  _id?: string;
  user_id?: string;
  name?: string;
  person_name?: string;
  company_name?: string;
  companyName?: string;
  phone?: string;
  phone_number?: string;
  email?: string;
  role?: string;
  status?: string;
  registrationDate?: string;
  created_at?: string;
  createdAt?: string;
  last_login?: string;
  lastLogin?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  gstNumber?: string;
  pan_number?: string;
  panNumber?: string;
  kyc_status?: string;
  kycStatus?: string;
  total_auctions?: number;
  totalAuctions?: number;
  total_bids?: number;
  totalBids?: number;
  winning_bids?: number;
  winningBids?: number;
  documents_submitted?: string[];
  documentsSubmitted?: string[];
  verification_notes?: string;
  verificationNotes?: string;
  [key: string]: any;
}

export interface NormalizedUserRecord {
  id: string;
  name: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  role: 'auctioneer' | 'participant' | string;
  status: 'active' | 'pending' | 'blocked' | string;
  registrationDate: string;
  lastLogin: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  companyType?: string;
  companyAddress?: string;

  businessCategory?: string;
  kycStatus: 'pending' | 'verified' | 'rejected' | string;
  documentsSubmitted: string[];
  totalAuctions: number;
  totalBids: number;
  winningBids: number;
  verificationNotes?: string;
}

export interface UsersListResponse {
  success?: boolean;
  message?: string;
  data?: any;
  users?: RawUserRecord[]; // some APIs may return at top-level
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface UsersListResult {
  users: NormalizedUserRecord[];
  total: number;
  page: number;
  limit: number;
  pagination: PaginationMeta;
  raw: any;
}

class UserService {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    let adminToken: string | null = null;
    try {
      adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (k.startsWith('admin_token')) {
            adminToken = sessionStorage.getItem(k);
            break;
          }
        }
      }
    } catch (_) {
      adminToken = null;
    }
    const authToken = token || adminToken || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  // Approve user
  async approveUser(id: string, token?: string): Promise<void> {
    if (!id) throw new Error('User ID is required');
    const url = `${ADMIN_USERS_BASE_URL}/${id}/status`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ is_approved: 1, is_active: 1 })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `Failed to approve user ${id} (${res.status})`);
    }
  }

  // Block user
  async blockUser(id: string, token?: string): Promise<void> {
    if (!id) throw new Error('User ID is required');
    const url = `${ADMIN_USERS_BASE_URL}/${id}/status`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ is_active: 0 })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `Failed to block user ${id} (${res.status})`);
    }
  }

  private normalizeUser(raw: RawUserRecord): NormalizedUserRecord {
    return {
      id: String(raw.id || raw._id || raw.user_id || ''),
      name: (raw.name || raw.person_name || 'Unknown').trim(),
      companyName: (raw.companyName || raw.company_name || '—').trim(),
      phoneNumber: raw.phone_number || raw.phone || '—',
      email: raw.email || '—',
      role: (raw.role as any) || 'participant',
      status: (raw.status as any) || 'active',
      registrationDate: raw.registrationDate || raw.created_at || raw.createdAt || '',
      lastLogin: raw.last_login || raw.lastLogin || '—',
      city: raw.city || '—',
      state: raw.state || '—',
      pincode: raw.pincode || '—',
      gstNumber: raw.gstNumber || raw.gst_number,
      panNumber: raw.panNumber || raw.pan_number,
      companyType: raw.companyType,
      businessCategory: raw.businessCategory,
      companyAddress: raw.company_address || raw.companyAddress || '—',

      kycStatus: (raw.kycStatus || raw.kyc_status || 'pending') as any,
      documentsSubmitted: raw.documentsSubmitted || raw.documents_submitted || [],
      totalAuctions: raw.auctions_created ?? 0,
      totalBids: raw.bids_placed ?? 0,
      winningBids: raw.winning_bids ?? 0, // Keep this if you expect it in the future
      verificationNotes: raw.verificationNotes || raw.verification_notes,
    };
  }

  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string; // active|pending|blocked
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    token?: string;
  } = {}): Promise<UsersListResult> {
    const { page = 1, limit = 10, search = '', status = '', sortBy, sortOrder, token } = params;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (search) query.set('search', search);
    if (status && status !== 'all') query.set('status', status);
    if (sortBy) query.set('sortBy', sortBy);
    if (sortOrder) query.set('sortOrder', sortOrder);

    const url = `${ADMIN_USERS_BASE_URL}?${query.toString()}`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    const json: UsersListResponse = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      throw new Error((json && (json as any).message) || `Failed to fetch users (${res.status})`);
    }

    const dataBlock: any = json.data || json; // backend may wrap in data
    const rawUsers: RawUserRecord[] = dataBlock.users || dataBlock.data || json.users || [];
    const total = dataBlock.total || dataBlock.totalUsers || rawUsers.length || json.total || 0;
    const currentPage = dataBlock.page || json.page || page;
    const currentLimit = dataBlock.limit || json.limit || limit;
    const normalized = rawUsers.map(u => this.normalizeUser(u));

    return {
      users: normalized,
      total,
      page: currentPage,
      limit: currentLimit,
      pagination: { total, page: currentPage, limit: currentLimit },
      raw: json
    };
  }

  async getUserById(id: string, token?: string): Promise<NormalizedUserRecord> {
    if (!id) throw new Error('User id required');
    const url = `${ADMIN_USERS_BASE_URL}/${id}`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `Failed to fetch user ${id} (${res.status})`);
    }
    const raw: RawUserRecord = json.data || json.user || json;
    return this.normalizeUser(raw);
  }
}

export default new UserService();

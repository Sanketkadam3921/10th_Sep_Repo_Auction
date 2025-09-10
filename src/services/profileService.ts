// Profile service with lightweight caching + normalization + abort/timeout.
const API_BASE_URL = 'https://auction-development.onrender.com/api/auth';

// Simple in-memory cache (reset on reload). Could be replaced by react-query later.
interface CacheEntry<T> { value: T; ts: number; }
const profileCache: { profile?: CacheEntry<ProfileResponse> } = {};
const PROFILE_TTL_MS = 60_000; // 1 minute freshness window
const DEFAULT_TIMEOUT_MS = 8_000; // abort slow cold-start responses

export interface BackendProfileUser {
  id?: string;
  user_id?: string;
  phoneNumber?: string; // camelCase variant from some responses
  phone_number?: string; // snake_case variant
  personName?: string;
  person_name?: string;
  name?: string;
  mailId?: string;
  email?: string;
  companyName?: string;
  company_name?: string;
  companyAddress?: string;
  company_address?: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: any;
  user?: BackendProfileUser; // sometimes API might return user directly
}

export interface UpdateProfilePayload {
  phone_number?: string; // only if phone changed and backend allows
  email?: string;
  person_name?: string;
  company_name?: string;
  company_address?: string;
}

class ProfileService {
  private normalizeUser(raw: BackendProfileUser | any | undefined): BackendProfileUser | undefined {
    if (!raw) return undefined;
    return {
      id: raw.id || raw.user_id,
      user_id: raw.user_id || raw.id,
      phoneNumber: raw.phoneNumber || raw.phone_number,
      phone_number: raw.phone_number || raw.phoneNumber,
      personName: raw.personName || raw.person_name || raw.name,
      person_name: raw.person_name || raw.personName || raw.name,
      name: raw.name || raw.personName || raw.person_name,
      mailId: raw.mailId || raw.email,
      email: raw.email || raw.mailId,
      companyName: raw.companyName || raw.company_name,
      company_name: raw.company_name || raw.companyName,
      companyAddress: raw.companyAddress || raw.company_address,
      company_address: raw.company_address || raw.companyAddress,
      role: raw.role,
      isVerified: raw.isVerified,
      createdAt: raw.createdAt || raw.created_at,
      created_at: raw.created_at || raw.createdAt,
    };
  }

  private wrapResponse(json: any): ProfileResponse {
    const user = this.normalizeUser(json?.user || json?.data?.user || json?.data);
    return { success: json?.success !== false, message: json?.message, data: json?.data, user };
  }

  private async timedFetch(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, { ...rest, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const authToken = token || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  async getProfile(token?: string): Promise<ProfileResponse> {
    try {
      // Serve from cache if fresh
      const cached = profileCache.profile;
      const now = Date.now();
      if (cached && now - cached.ts < PROFILE_TTL_MS) {
        return cached.value;
      }

      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Failed to fetch profile (${res.status})`);
      const wrapped = this.wrapResponse(json);
      profileCache.profile = { value: wrapped, ts: Date.now() };
      return wrapped;
    } catch (err) {
      console.error('getProfile error:', err);
      throw err;
    }
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload, token?: string): Promise<ProfileResponse> {
    const url = `${API_BASE_URL}/profile/${userId}`;
    const headers = this.getAuthHeaders(token);

    // Try PUT; fallback to PATCH if method not allowed
    const attempt = async (method: 'PUT' | 'PATCH') => {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Profile update failed (${res.status})`);
      return json;
    };

    try {
      const result = await attempt('PUT');
      const wrapped = this.wrapResponse(result);
      // Invalidate + optimistic cache update
      profileCache.profile = { value: wrapped, ts: Date.now() };
      return wrapped;
    } catch (e: any) {
      if (e?.message?.includes('405')) {
        const patchRes = await attempt('PATCH');
        const wrapped = this.wrapResponse(patchRes);
        profileCache.profile = { value: wrapped, ts: Date.now() };
        return wrapped;
      }
      throw e;
    }
  }

  // Allow manual cache priming (e.g., after login) with raw backend shape
  prime(profileJson: any) {
    const wrapped = this.wrapResponse(profileJson);
    profileCache.profile = { value: wrapped, ts: Date.now() };
    return wrapped;
  }

  // Allow external invalidation (e.g., logout)
  clearCache() {
    delete profileCache.profile;
  }
}

export default new ProfileService();

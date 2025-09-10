// Updated admin dashboard endpoint base (full dashboard)
const ADMIN_DASHBOARD_URL = 'https://auction-development.onrender.com/api/fulldashboard/admin';

export interface AdminDashboardRaw {
  success?: boolean;
  message?: string;
  data?: any;
}

class AdminService {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // Prefer a manually stored admin token in sessionStorage (useful for pasting Postman token)
    let adminToken: string | null = null;
    try {
      adminToken = sessionStorage.getItem('adminToken');
      // If not present, look for any key that begins with 'admin_token' (e.g. admin_token_1756920688503)
      if (!adminToken) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (k && k.startsWith('admin_token')) {
            adminToken = sessionStorage.getItem(k);
            break;
          }
        }
      }
    } catch (e) {
      // ignore access errors (e.g., restricted storage)
      adminToken = null;
    }

    const authToken = token || adminToken || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  async getDashboard(token?: string): Promise<AdminDashboardRaw> {
    // New endpoint returns full dashboard data directly
    const res = await fetch(ADMIN_DASHBOARD_URL, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Failed to fetch dashboard (${res.status})`);
    return json as AdminDashboardRaw;
  }
}

export default new AdminService();

// src/services/adminReportService.ts
// Integrates admin reports endpoints:
//  GET /api/admin/reports/Overview
//  GET /api/admin/reports/report/auction-performance?filter={today|this_week|this_month|this_year}

const ADMIN_REPORTS_BASE = 'https://auction-development.onrender.com/api/admin/reports';

export interface AdminOverviewReport {
  totalAuctions: number;
  completedAuctions: number;
  cancelledAuctions: number;
  totalUsers: number;
  newUsers: number;
  totalRevenue: number;
  averageBidValue: number;
  topCategory: string;
  participationRate: number; // percentage
  [k: string]: any;
}

export interface AdminAuctionPerformanceItem {
  id: string;
  title: string;
  auctioneer: string;
  company: string;
  category: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  finalPrice: number; // closing price
  participants: number;
  totalBids: number;
  status: string;
  revenue: number; // commission or derived value
  [k: string]: any;
}

export interface AdminUserActivityItem {
  id: string;
  name: string;
  company: string;
  role: string;
  registrationDate: string;
  totalAuctions: number;
  totalBids: number;
  winningBids: number;
  totalSpent: number;
  status: string;
  [k: string]: any;
}

class AdminReportService {
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

  private extractArray(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    // Common nested property names
  const candidateKeys = ['report', 'data', 'list', 'records', 'auctions', 'users', 'items', 'result', 'user_activity_report'];
    for (const key of candidateKeys) {
      if (Array.isArray((payload as any)[key])) return (payload as any)[key];
    }
    // Scan first array of objects in object values
    for (const val of Object.values(payload)) {
      if (Array.isArray(val) && val.every(v => typeof v === 'object')) return val as any[];
    }
    // If payload has nested 'report' object containing arrays inside
    if ((payload as any).report && typeof (payload as any).report === 'object') {
      return this.extractArray((payload as any).report);
    }
    return [];
  }

  private normalizeOverview(raw: any): AdminOverviewReport {
    return {
      totalAuctions: Number(raw.totalAuctions ?? raw.total_auctions ?? 0),
      completedAuctions: Number(raw.completedAuctions ?? raw.completed_auctions ?? 0),
      cancelledAuctions: Number(raw.cancelledAuctions ?? raw.canceledAuctions ?? raw.cancelled_auctions ?? 0),
      totalUsers: Number(raw.totalUsers ?? raw.total_users ?? 0),
      newUsers: Number(raw.newUsers ?? raw.new_users ?? 0),
      totalRevenue: Number(raw.totalRevenue ?? raw.total_revenue ?? raw.revenue ?? 0),
      averageBidValue: Number(raw.averageBidValue ?? raw.average_bid_value ?? raw.avgBid ?? 0),
      topCategory: raw.topCategory || raw.top_category || raw.bestCategory || '—',
      participationRate: Number(raw.participationRate ?? raw.participation_rate ?? raw.participation ?? 0),
      ...raw,
    };
  }

  private normalizeAuctionPerformanceItem(item: any): AdminAuctionPerformanceItem {
    // Support nested shape from provided response sample
    const details = item.auction_details || {};
    const auctioneerBlock = item.auctioneer || {};
    const financial = item.financial_data || {};
    const participation = item.participation || {};
    const basePriceRaw = financial.base ?? financial.base_price ?? financial.starting_price ?? item.basePrice;
    const finalPriceRaw = financial.final ?? financial.final_price ?? item.finalPrice;
    const revenueRaw = financial.revenue ?? financial.commission ?? item.revenue;

    const basePrice = Number(basePriceRaw || 0);
    const finalPrice = Number(finalPriceRaw || 0);
    let revenue = Number(revenueRaw || 0);
    if (!revenue && finalPrice) revenue = finalPrice * 0.05;

    return {
      id: String(item.id || item._id || details.id || ''),
      title: details.title || item.title || 'Untitled Auction',
      auctioneer: auctioneerBlock.name || item.auctioneer || '—',
      company: auctioneerBlock.company || item.company || '—',
      category: item.category || 'general',
      startDate: details.date || item.startDate || item.start_date || '',
      endDate: details.date || item.endDate || item.end_date || details.date || '',
      basePrice,
      finalPrice,
      participants: Number(participation.participants ?? item.participants ?? 0),
      totalBids: Number(participation.total_bids ?? item.totalBids ?? 0),
      status: item.status || 'unknown',
      revenue,
      raw: item,
    };
  }

  private normalizeUserActivityItem(item: any): AdminUserActivityItem {
    // Support possible nested shapes
    const user = item.user || item.user_details || {};
    const roleReg = item.role_registration || {};
    const activity = item.activity || item.auction_activity || {};
    let financial = item.financial || item.financial_data || {};
    // financial may be string 'N/A'
    if (typeof financial === 'string') financial = {};
    const num = (v: any) => {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[^0-9.-]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };
    return {
      id: String(item.id || user.id || user._id || `${user.name || 'user'}_${roleReg.registration_date || ''}`),
      name: user.name || item.name || 'Unknown',
      company: user.company || item.company || '—',
      role: (roleReg.role || user.role || item.role || 'participant'),
      registrationDate: roleReg.registration_date || user.registrationDate || user.registered_at || item.registrationDate || '',
      totalAuctions: num(activity.totalAuctions ?? activity.auctions ?? item.totalAuctions),
      totalBids: num(activity.totalBids ?? activity.bids ?? item.totalBids),
      winningBids: num(activity.winningBids ?? activity.wins ?? item.winningBids),
      totalSpent: num(financial.totalSpent ?? financial.total ?? financial.spent ?? financial.amount ?? item.totalSpent),
      status: (item.status || user.status || 'pending'),
      raw: item,
    };
  }

  async getOverview(token?: string): Promise<AdminOverviewReport> {
    const res = await fetch(`${ADMIN_REPORTS_BASE}/Overview`, { headers: this.getAuthHeaders(token) });
    const text = await res.text();
    let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(json.message || `Failed to fetch overview (${res.status})`);
    const data = json.data || json.overview || json; // adapt to possible nesting
    return this.normalizeOverview(data);
  }

  async getAuctionPerformance(filter: 'today' | 'this_week' | 'this_month' | 'this_year' = 'this_month', token?: string): Promise<AdminAuctionPerformanceItem[]> {
    const url = `${ADMIN_REPORTS_BASE}/report/auction-performance?filter=${encodeURIComponent(filter)}`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    const text = await res.text();
    let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(json.message || `Failed to fetch auction performance (${res.status})`);
    // Adjust for sample: success, filter, report: []
    let list = json.report || json.data || json.auctions || json.records || json.list || [];
    if (!Array.isArray(list)) list = this.extractArray(list);
    if (!Array.isArray(list)) return [];
    return list.map((i: any, idx: number) => {
      const norm = this.normalizeAuctionPerformanceItem(i);
      if (!norm.id) norm.id = `auction_${idx}`;
      return norm;
    });
  }

  async getUserActivity(period: 'today' | 'this_week' | 'this_month' | 'this_year' = 'this_month', token?: string): Promise<AdminUserActivityItem[]> {
    const url = `${ADMIN_REPORTS_BASE}/reports/user-activity?period=${encodeURIComponent(period)}`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    const text = await res.text();
    let json: any = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(json.message || `Failed to fetch user activity (${res.status})`);
  let list = json.user_activity_report || json.report || json.data || json.users || json.records || [];
    if (!Array.isArray(list)) list = this.extractArray(list);
    if (!Array.isArray(list)) return [];
    return list.map((r: any, idx: number) => {
      const norm = this.normalizeUserActivityItem(r);
      if (!norm.id) norm.id = `user_${idx}`;
      return norm;
    });
  }
}

export default new AdminReportService();
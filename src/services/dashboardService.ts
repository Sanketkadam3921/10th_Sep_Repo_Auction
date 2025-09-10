import axios from 'axios';

// Types for the dashboard API response
export interface DashboardStatsResponse {
  total_created: number;
  active_auctions: number;
  participated_auctions: number;
  live_auctions: number;
  total_bids: number;
  winning_bids: number;
  avg_response_time: string;
}

export interface DashboardUpcomingAuctionApi {
  id: number;
  title: string;
  status: string; // e.g. 'Live' | 'Upcoming'
  auction_date: string; // formatted date e.g. 'Sep 1, 2025'
  start_time: string; // HH:mm
  duration: string;   // e.g. '1 hour'
  current_price: string; // formatted 'INR 10.00'
  participant_count: number;
  bid_count: number;
  auction_no: string;
  creator: string;
}

export interface DashboardRecentActivityApi {
  type: string; // 'created' | 'joined' | 'won' etc.
  message: string;
  timestamp: string; // human readable e.g. '2h ago'
  icon: string;      // emoji
  auction_id: number;
}

export interface FullDashboardApiResponse {
  success: boolean;
  dashboard: {
    welcome_message: string;
    stats: DashboardStatsResponse;
    upcoming_auctions: DashboardUpcomingAuctionApi[];
    recent_activities: DashboardRecentActivityApi[];
  };
}

const DEFAULT_BASE = 'https://auction-development.onrender.com/api';
const BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');

export async function fetchFullDashboard(token?: string): Promise<FullDashboardApiResponse> {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const authToken = token || localStorage.getItem('authToken') || '';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const { data } = await axios.get<FullDashboardApiResponse>(`${BASE_URL}/fulldashboard`, { headers, withCredentials: false });
    return data;
  } catch (err: any) {
    // Normalize error
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
    const message = serverMsg || err.message || 'Dashboard fetch failed';
    const wrapped = new Error(`Dashboard API error${status ? ' (' + status + ')' : ''}: ${message}`);
    // Attach original for debugging
    // @ts-ignore
    wrapped.cause = err;
    throw wrapped;
  }
}

export default { fetchFullDashboard };
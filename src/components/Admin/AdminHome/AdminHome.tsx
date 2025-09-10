// File: src/components/Admin/AdminHome/AdminHome.tsx
import React, { useMemo, useEffect, useState } from 'react';
import {
  Users,
  Gavel,
  TrendingUp,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Settings,
  LucideIcon,
} from 'lucide-react';
import './AdminHome.css';
import LoadingGate from '../../Common/LoadingGate';
import adminService from '../../../services/adminService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from "react-router-dom";

// Type definitions for improved code clarity and bug prevention
interface Stat {
  title: string;
  value: string;
  subText: string;
  subTextColor: string;
  icon: LucideIcon;
}

interface ActivityItem {
  id: number;
  type: 'auction_created' | 'user_registered' | 'auction_completed' | 'user_approved' | 'auction_cancelled';
  message: string;
  time: string;
}

interface AuctionItem {
  id: number;
  title: string;
  company: string;
  startTime: string;
  basePrice: string;
  participants: number;
  auctionNo?: string;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: string;
  action: string;
  count: number;
}

const AdminHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState(() => ({
    totalUsers: 0,
    activeAuctions: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    todayAuctions: 0,
    upcomingAuctions: 0,
    completedAuctions: 0,
    cancelledAuctions: 0,
    newUsersToday: 0,
    systemHealth: 'Unknown',
  } as any));

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<AuctionItem[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Prefer manual admin token for the full dashboard
    const token = (() => {
      const direct = sessionStorage.getItem('adminToken');
      if (direct) return direct;
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i) || '';
        if (k.startsWith('admin_token')) return sessionStorage.getItem(k);
      }
      return localStorage.getItem('authToken');
    })();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getDashboard(token || undefined);
        // New API returns { success: true, dashboard: { overview, recent_activities, upcoming_auctions, quick_actions } }
        const apiResponse: any = res;
        const dashboard = apiResponse.dashboard || apiResponse;
        const overview = dashboard.overview || {};

        if (!mounted) return;

        // Map overview fields to dashboard stats
        setDashboardStats({
          totalUsers: overview.total_users ?? 0,
          activeAuctions: overview.live_auctions ?? 0,
          pendingApprovals: overview.pending_users ?? 0,
          totalRevenue: overview.total_revenue ?? 0,
          todayAuctions: overview.today_auctions ?? 0,
          upcomingAuctions: overview.upcoming_auctions ?? 0,
          completedAuctions: overview.completed_auctions ?? 0,
          cancelledAuctions: overview.cancelled_auctions ?? 0,
          newUsersToday: overview.new_users_7d ?? 0,
          totalBids: overview.total_bids ?? 0,
          totalParticipants: overview.total_participants ?? 0,
          newAuctions7d: overview.new_auctions_7d ?? 0,
          pendingAuctions: overview.pending_auctions ?? 0,
          systemHealth: 'Healthy',
        });

        // Map recent activities
        setRecentActivities(
          (dashboard.recent_activities || []).slice(0, 10).map((activity: any) => ({
            id: activity.id,
            type: activity.type as ActivityItem['type'],
            message: activity.message,
            time: activity.time_ago || activity.formatted_time,
          }))
        );

        // Map upcoming auctions
        setUpcomingAuctions(
          (dashboard.upcoming_auctions || []).map((auction: any) => ({
            id: auction.id,
            title: auction.title,
            company: auction.company,
            startTime: auction.start_time === 'Invalid Date' ? 'TBD' : auction.start_time,
            basePrice: 'N/A', // Not provided in the API response
            participants: auction.participant_count,
            auctionNo: auction.auction_no,
          }))
        );

        // Store quick actions for later use
        setQuickActions(dashboard.quick_actions || []);

      } catch (e: any) {
        console.error('Admin dashboard load error', e);
        if (!mounted) return;
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Consolidated and optimized stat cards data for cleaner JSX
  const statCards: Stat[] = useMemo(
    () => [
      {
        title: 'Total Users',
        value: Number(dashboardStats.totalUsers || 0).toLocaleString(),
        subText: `+${dashboardStats.newUsersToday || 0} in 7 days`,
        subTextColor: 'text-green-600',
        icon: Users,
      },
      {
        title: 'Live Auctions',
        value: String(dashboardStats.activeAuctions || 0),
        subText: `${dashboardStats.upcomingAuctions || 0} upcoming`,
        subTextColor: 'text-blue-600',
        icon: Gavel,
      },
      {
        title: 'Total Bids',
        value: Number(dashboardStats.totalBids || 0).toLocaleString(),
        subText: 'Across all auctions',
        subTextColor: 'text-green-600',
        icon: TrendingUp,
      },
      {
        title: 'Total Participants',
        value: String(dashboardStats.totalParticipants || 0),
        subText: 'Active bidders',
        subTextColor: 'text-blue-600',
        icon: Users,
      },
      {
        title: 'Pending Users',
        value: String(dashboardStats.pendingApprovals || 0),
        subText: 'Awaiting approval',
        subTextColor: 'text-orange-600',
        icon: Users,
      },
      {
        title: 'Pending Auctions',
        value: String(dashboardStats.pendingAuctions || 0),
        subText: 'Need review',
        subTextColor: 'text-orange-600',
        icon: AlertTriangle,
      },
    ],
    [dashboardStats]
  );

  // Consolidated and optimized auction status cards data
  const auctionStatusCards: Stat[] = useMemo(
    () => [
      {
        title: 'Upcoming Auctions',
        value: dashboardStats.upcomingAuctions.toString(),
        subText: '',
        subTextColor: 'text-blue-600',
        icon: Calendar,
      },
      {
        title: 'Completed Auctions',
        value: dashboardStats.completedAuctions.toString(),
        subText: '',
        subTextColor: 'text-green-600',
        icon: CheckCircle,
      },
      {
        title: 'Cancelled Auctions',
        value: dashboardStats.cancelledAuctions.toString(),
        subText: '',
        subTextColor: 'text-red-600',
        icon: XCircle,
      },
    ],
    [dashboardStats]
  );

  const getActivityIconAndColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'auction_created':
        return { Icon: Gavel, color: 'text-blue-600' };
      case 'user_registered':
        return { Icon: Users, color: 'text-green-600' };
      case 'auction_completed':
        return { Icon: CheckCircle, color: 'text-green-600' };
      case 'user_approved':
        return { Icon: CheckCircle, color: 'text-blue-600' };
      case 'auction_cancelled':
        return { Icon: XCircle, color: 'text-red-600' };
      default:
        return { Icon: Activity, color: 'text-gray-600' };
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Dashboard</h2>
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <LoadingGate ready={!loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="admin-header">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <div className="system-status">
            <Activity className="w-4 h-4 mt-2 mr-2" />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid stat-cards grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
                      <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      <p className={`text-sm ${stat.subTextColor}`}>{stat.subText}</p>
                    </div>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Auction Status Overview */}
        <div className="grid stat-cards grid-cols-1 lg:grid-cols-3 gap-6">
          {auctionStatusCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
                      <p className={`text-3xl font-bold ${stat.subTextColor}`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.subTextColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activities & Upcoming Auctions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="card">
            <div className="card-header">
              <h2 className="recent-activities-title">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activities
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const { Icon, color } = getActivityIconAndColor(activity.type);
                  return (
                    <div key={activity.id} className="recent-activity-row">
                      <Icon className={`w-4 h-4 activity-icon ${color}`} />
                      <div className="activity-text">
                        <p className="text-sm text-text-primary">{activity.message}</p>
                        <p className="text-xs text-text-secondary mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Auctions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold upcoming-heading">
                <Clock className="w-5 h-5" />
                <span className="upcoming-heading-text">Upcoming Auctions</span>
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {upcomingAuctions.map((auction) => (
                  <div key={auction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-primary">{auction.title}</h3>
                      <div className="text-right">
                        <span className="text-sm text-text-secondary">
                          {auction.participants} participants
                        </span>
                        {auction.auctionNo && (
                          <div className="text-xs text-blue-400 mt-1">{auction.auctionNo}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">Company: {auction.company}</p>
                    <p className="text-sm text-text-secondary mb-1">Start Time: {auction.startTime}</p>
                    <p className="text-sm font-medium text-primary">Base Price: {auction.basePrice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {/* Approve Pending Users */}
              <button
                className="btn btn-primary"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </button>

              {/* Review Auction Requests */}
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/admin/auctions")}
              >
                <Gavel className="w-4 h-4 mr-2" />
                Review Auction Requests
              </button>

              {/* Generate Reports */}
              <button
                className="btn btn-outline"
                onClick={() => navigate("/admin/reports")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </LoadingGate>
  );
};

export default AdminHome;
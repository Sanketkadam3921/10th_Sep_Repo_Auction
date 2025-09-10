import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AuctionService from '../../../services/auctionService';
import dashboardService, { FullDashboardApiResponse, DashboardUpcomingAuctionApi, DashboardRecentActivityApi } from '../../../services/dashboardService';
import apiAuctionService from '../../../services/apiAuctionService';
import { BaseAuction } from '../../../types/auction';
import './DashboardHome.css';
import { Tag, UserPlus, PlusCircle, User, CheckCircle, BarChart, Search, Gavel } from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [myAuctions, setMyAuctions] = useState<BaseAuction[]>([]); // fallback/local
  const [participatedAuctions, setParticipatedAuctions] = useState<BaseAuction[]>([]); // fallback/local
  const [loading, setLoading] = useState(true);
  const [useRemote, setUseRemote] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Here's what's happening with your auctions today.");
  const [remoteStats, setRemoteStats] = useState<FullDashboardApiResponse['dashboard']['stats'] | null>(null);
  const [remoteUpcoming, setRemoteUpcoming] = useState<DashboardUpcomingAuctionApi[]>([]);
  const [remoteActivities, setRemoteActivities] = useState<DashboardRecentActivityApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [participatedOverride, setParticipatedOverride] = useState<number | null>(null); // authoritative user-specific participated count
  const [createdOverride, setCreatedOverride] = useState<number | null>(null); // authoritative user-specific created count
  const iconMap: Record<string, JSX.Element> = {
    bid: <Tag className="w-5 h-5 text-indigo-500" />,
    join: <UserPlus className="w-5 h-5 text-green-500" />,
    create: <PlusCircle className="w-5 h-5 text-blue-500" />,
    profile: <User className="w-5 h-5 text-yellow-500" />,
    default: <CheckCircle className="w-5 h-5 text-gray-500" />,
  };



  interface ActivityItem {
    type: string;
    action: string;
    time: string;
    icon?: JSX.Element;
  }
  // Initialize data and load auctions
  useEffect(() => {
    if (!user) return;
    console.log(`[DashboardHome] Loading dashboard for user:`, { id: user.id, phone: user.phoneNumber, role: user.role });
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Attempt remote fetch first
        const token = localStorage.getItem('authToken') || undefined; // supply auth token if present
        const remote = await dashboardService.fetchFullDashboard(token);
        if (!cancelled && remote.success) {
          setUseRemote(true);
          setWelcomeMessage(remote.dashboard.welcome_message);

          // @ts-ignore
          setRemoteStats(remote.dashboard.stats);
          setRemoteUpcoming(remote.dashboard.upcoming_auctions);
          setRemoteActivities(remote.dashboard.recent_activities);

          // Always compute authoritative user-specific counts (backend stats may be aggregate or incorrect per user)
          try {
            const [participatedRaw, createdRaw] = await Promise.all([
              apiAuctionService.fetchFilteredAuctions({ status: 'all', type: 'participated' }),
              // use dedicated my-auctions endpoint; if it fails fallback to filtered created
              apiAuctionService.fetchMyAuctions('all').catch(async () =>
                apiAuctionService.fetchFilteredAuctions({ status: 'all', type: 'created' })
              )
            ]);

            const userPhone = user?.phoneNumber;
            const userId = user?.id;

            const participatedUser = participatedRaw.filter(a => a.participants?.includes(userPhone || ''));
            const createdUser = createdRaw.filter(a => (
              a.createdBy === userId ||
              a.userId === userId ||
              a.createdBy === user?.companyName ||
              a.auctioneerCompany === user?.companyName
            ));
            if (!cancelled) {
              setParticipatedOverride(participatedUser.length);
              setCreatedOverride(createdUser.length);
              console.log('[DashboardHome] User-specific overrides', {
                backendParticipated: remote.dashboard.stats?.participated_auctions,
                actualParticipated: participatedUser.length,
                backendCreated: remote.dashboard.stats?.total_created,
                actualCreated: createdUser.length
              });
            }
          } catch (recalcErr) {
            console.warn('[DashboardHome] authoritative recount failed', recalcErr);
          }
        }
      } catch (e: any) {
        console.warn('Remote dashboard fetch failed, falling back to local data', e);
        if (!cancelled) {
          setUseRemote(false);
          setError(
            (e instanceof Error && e.message)
              ? `${e.message}. Showing local data`
              : 'Live dashboard unavailable, showing local data'
          );
          // Fallback local
          try {
            AuctionService.initializeData();
            const createdAuctions = AuctionService.getAuctionsByUser(user.id);
            setMyAuctions(createdAuctions);
            const participationAuctions = AuctionService.getAuctionsForParticipant(user.id);
            setParticipatedAuctions(participationAuctions);
          } catch (err) {
            console.error('Error loading local fallback dashboard data:', err);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Calculate dynamic stats
  const getStats = () => {
    if (useRemote && remoteStats) {
      const participatedCount = participatedOverride ?? remoteStats.participated_auctions;
      const createdCount = createdOverride ?? remoteStats.total_created;
      return [
        {
          title: 'My Active Auctions',
          value: remoteStats.active_auctions.toString(),
          change: `${createdCount} total created${createdOverride !== null ? ' (verified)' : ''}`,
          icon: Gavel,
          color: 'bg-blue-500',
        },
        {
          title: 'Participated Auctions',
          value: participatedCount.toString(),
          change: `${remoteStats.live_auctions} live now${participatedOverride !== null ? ' (verified)' : ''}`,
          icon: Users,
          color: 'bg-green-500',
        },
        {
          title: 'Total Bids Placed',
          value: remoteStats.total_bids.toString(),
          change: `${remoteStats.winning_bids} winning`,
          icon: TrendingUp,
          color: 'bg-purple-500',
        },

      ];
    }
    // Local fallback
    const activeAuctions = myAuctions.filter(a => a.status === 'live' || a.status === 'upcoming');
    const totalParticipated = participatedAuctions.length;
    let totalBids = 0;
    participatedAuctions.forEach(auction => {
      const bids = AuctionService.getBidsByAuction(auction.id);
      totalBids += bids.filter(bid => bid.userId === user?.id).length;
    });
    return [
      {
        title: 'My Active Auctions',
        value: activeAuctions.length.toString(),
        change: `${myAuctions.length} total created`,
        icon: Calendar,
        color: 'bg-blue-500',
      },
      {
        title: 'Participated Auctions',
        value: totalParticipated.toString(),
        change: `${participatedAuctions.filter(a => a.status === 'live').length} live now`,
        icon: Users,
        color: 'bg-green-500',
      },
      {
        title: 'Total Bids Placed',
        value: totalBids.toString(),
        change: `across ${totalParticipated} auctions`,
        icon: TrendingUp,
        color: 'bg-purple-500',
      },

    ];
  };

  // Get upcoming auctions (both created and participating)
  const getUpcomingAuctions = () => {
    if (useRemote) {
      return remoteUpcoming.slice(0, 5); // already prioritized by API
    }
    const allUpcoming: Array<BaseAuction & { role: 'auctioneer' | 'participant' }> = [];
    myAuctions
      .filter(a => a.status === 'upcoming' || a.status === 'live')
      .slice(0, 2)
      .forEach(auction => { allUpcoming.push({ ...auction, role: 'auctioneer' }); });
    participatedAuctions
      .filter(a => a.status === 'upcoming' || a.status === 'live')
      .slice(0, 3 - allUpcoming.length)
      .forEach(auction => { allUpcoming.push({ ...auction, role: 'participant' }); });
    return allUpcoming.slice(0, 3);
  };

  // Get recent activity
  const getRecentActivity = () => {
    if (useRemote) {
      return remoteActivities.map(a => ({
        action: a.message,
        time: a.timestamp,
        type: a.type,
        // force icon mapping here instead of trusting backend
        icon: iconMap[a.type] || iconMap.default
      })).slice(0, 8);
    }

    const activities: Array<{ action: string; time: string; type: string; icon?: string }> = [];
    myAuctions.slice(0, 2).forEach(auction => { activities.push({ action: `Created auction "${auction.title}"`, time: 'Recently', type: 'create' }); });
    participatedAuctions.slice(0, 2).forEach(auction => { activities.push({ action: `Joined auction "${auction.title}"`, time: 'Recently', type: 'join' }); });
    return activities.slice(0, 4);
  };

  const stats = getStats();
  const upcomingAuctions = getUpcomingAuctions();
  const recentActivity = getRecentActivity();

  if (loading) {
    return (
      <div className="ap-dashboard-home-wrapper">
        {/* <div className="ap-dashboard-home-loading">
          <div className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div> */}
                <div className="spinner-container">
  <div className="loading-spinner"></div>
  <div className="loading-text">Loading auction data...</div>
</div>
      </div>
    );
  }
  

  return (
    
    <div className="ap-dashboard-home-wrapper">
      {/* Header Section */}
      <div className="ap-dashboard-home-header">
        <div className="ap-dashboard-home-header-content">
          <div className="ap-dashboard-home-title-section">
            <h1 className="ap-dashboard-home-title">
              <Activity className="w-8 h-8" />
              Dashboard Overview
            </h1>

            



            <p className="ap-dashboard-home-subtitle">
              Monitor your auction activities and performance
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ap-dashboard-home-container">
        {/* Welcome Section */}
        <div className="ap-dashboard-home-welcome">
          <div className="ap-dashboard-home-welcome-header">
            <div className="ap-dashboard-home-welcome-text">
              <h1>
                Welcome back!
              </h1>
              <p>
                {welcomeMessage}
              </p>
              {error && (
                <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '4px' }}>
                  {error}
                </p>
              )}
            </div>
            <Link to="/dashboard/new-auction" className="ap-dashboard-home-welcome-btn">
              <Plus className="w-4 h-4" />
              Create Auction
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ap-dashboard-home-stats">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="ap-dashboard-home-stat-card">
                <div className="ap-dashboard-home-stat-content">
                  <div className="ap-dashboard-home-stat-text">
                    <h3>
                      {stat.title}
                    </h3>
                    <p className="ap-dashboard-home-stat-value">
                      {stat.value}
                    </p>
                    <p className="ap-dashboard-home-stat-change">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`ap-dashboard-home-stat-icon ${stat.color.includes('blue') ? 'blue' : stat.color.includes('green') ? 'green' : stat.color.includes('purple') ? 'purple' : 'orange'}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ap-dashboard-home-content">
          {/* Upcoming Auctions */}
          <div className="ap-dashboard-home-section">
            <div className="ap-dashboard-home-section-header">
              <h2 className="ap-dashboard-home-section-title text-xl font-semibold">
                Upcoming Auctions
              </h2>
              <Link
                to="/dashboard/auctions"
                className="ap-dashboard-home-section-link"
              >
                View all
              </Link>
            </div>
            <div className="ap-dashboard-home-section-body">
              <div className="ap-dashboard-home-auction-list">
                {useRemote ? (
                  upcomingAuctions.map((a: any) => (
                    <div key={a.id} className="ap-dashboard-home-auction-item">
                      <div className="ap-dashboard-home-auction-content">
                        <div className="ap-dashboard-home-auction-header">
                          <h3 className="ap-dashboard-home-auction-title">{a.title}</h3>
                          <span className={`ap-dashboard-home-auction-badge ${a.status.toLowerCase() === 'live' ? 'live' : 'participant'}`}> {a.status.toUpperCase()} </span>
                        </div>
                        <div className="ap-dashboard-home-auction-meta">
                          <span>📅 {a.auction_date} at {a.start_time}</span>
                          <span>👥 {a.participant_count} participants</span>
                        </div>
                      </div>
                      <Link to={`/dashboard/auction/${a.id}`} className="ap-dashboard-home-auction-btn">
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                  ))
                ) : (
                  upcomingAuctions.map((auction: any) => (
                    <div key={auction.id} className="ap-dashboard-home-auction-item">
                      <div className="ap-dashboard-home-auction-content">
                        <div className="ap-dashboard-home-auction-header">
                          <h3 className="ap-dashboard-home-auction-title">{auction.title}</h3>
                          <span className={`ap-dashboard-home-auction-badge ${auction.status === 'live' ? 'live' : auction.role === 'auctioneer' ? 'auctioneer' : 'participant'}`}>
                            {auction.status === 'live' ? 'LIVE' : auction.role}
                          </span>
                        </div>
                        <div className="ap-dashboard-home-auction-meta">
                          <span>📅 {auction.auctionDate} at {auction.auctionStartTime}</span>
                          <span>👥 {AuctionService.getParticipantsByAuction(auction.id).length} participants</span>
                        </div>
                      </div>
                      <Link to={`/dashboard/auction/${auction.id}`} className="ap-dashboard-home-auction-btn">
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                  ))
                )}
              </div>
              {upcomingAuctions.length === 0 && (
                <div className="ap-dashboard-home-empty">
                  <Calendar className="ap-dashboard-home-empty-icon" />
                  <p className="ap-dashboard-home-empty-text">No upcoming auctions</p>
                  <Link to="/dashboard/new-auction" className="ap-dashboard-home-empty-btn">
                    Create your first auction
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="ap-dashboard-home-section">
            <div className="ap-dashboard-home-section-header flex items-center mb-4">
              <h2 className="ap-dashboard-home-section-title text-xl font-semibold">
                Recent Activity
              </h2>
            </div>
            <div className="ap-dashboard-home-section-body">
              <div className="ap-dashboard-home-activity-list space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="ap-dashboard-home-activity-item flex items-center space-x-4"
                  >

                    <div className={`ap-dashboard-home-activity-icon p-2 rounded-full ${activity.type === 'bid'
                      ? 'bg-indigo-100'
                      : activity.type === 'join'
                        ? 'bg-green-100'
                        : activity.type === 'create'
                          ? 'bg-blue-100'
                          : activity.type === 'profile'
                            ? 'bg-yellow-100'
                            : 'bg-gray-100'
                      }`}>
                      {activity.icon}
                    </div>

                    <div className="ap-dashboard-home-activity-content flex-1">
                      <p className="ap-dashboard-home-activity-text font-medium text-gray-800">
                        {activity.action}
                      </p>
                      <p className="ap-dashboard-home-activity-time text-sm text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="ap-dashboard-home-actions">
          <div className="ap-dashboard-home-actions-header">
            <h2 className="ap-dashboard-home-actions-title">
              Quick Actions
            </h2>
          </div>
          <div className="ap-dashboard-home-actions-body">
            <div className="ap-dashboard-home-actions-grid">

              <Link
                to="/dashboard/new-auction"
                className="ap-dashboard-home-action-card"
              >
                <div className="ap-dashboard-home-action-content">
                  <div className="ap-dashboard-home-action-text">
                    <h3>Create New Auction</h3>
                    <p>Set up a new auction quickly</p>
                  </div>

                  {/* reuse same class so color + hover match */}
                  <Gavel style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} />
                </div>
              </Link>

              <Link
                to="/dashboard/auctions"
                className="ap-dashboard-home-action-card"
              >
                <div className="ap-dashboard-home-action-content">
                  <div className="ap-dashboard-home-action-text">
                    <h3>Browse Auctions</h3>
                    <p>Find auctions to participate in</p>
                  </div>

                  <Search style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} />
                </div>
              </Link>

              <Link
                to="/dashboard/reports"
                className="ap-dashboard-home-action-card"
              >
                <div className="ap-dashboard-home-action-content">
                  <div className="ap-dashboard-home-action-text">
                    <h3>View Reports</h3>
                    <p>Analyze auction performance</p>
                  </div>

                  <BarChart style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} />
                </div>
              </Link>

            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default DashboardHome;
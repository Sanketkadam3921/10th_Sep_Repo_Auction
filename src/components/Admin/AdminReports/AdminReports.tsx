import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, TrendingUp, IndianRupee, Users, Gavel, Calendar, Download, Filter, Eye, FileText, PieChart } from 'lucide-react';
import './AdminReports.css';

type ReportType = 'overview' | 'auctions' | 'users' | 'revenue' | 'categories';
import adminReportService, { AdminOverviewReport, AdminAuctionPerformanceItem, AdminUserActivityItem } from '../../../services/adminReportService';

interface ReportData {
  period: string;
  totalAuctions: number;
  completedAuctions: number;
  cancelledAuctions: number;
  totalUsers: number;
  newUsers: number;
  totalRevenue: number;
  averageBidValue: number;
  topCategory: string;
  participationRate: number;
}

interface AuctionReport {
  id: string;
  title: string;
  auctioneer: string;
  company: string;
  category: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  finalPrice: number;
  participants: number;
  totalBids: number;
  status: string;
  revenue: number;
}

interface UserReport {
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
}

const AdminReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [overview, setOverview] = useState<AdminOverviewReport | null>(null);
  const [auctionPerformance, setAuctionPerformance] = useState<AdminAuctionPerformanceItem[]>([]);
  const [performanceFilter, setPerformanceFilter] = useState<'today' | 'this_week' | 'this_month' | 'this_year'>('this_month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<AdminUserActivityItem[]>([]);
  const [userPeriod, setUserPeriod] = useState<'today' | 'this_week' | 'this_month' | 'this_year'>('this_month');

  // Mock data - In real app, this would come from API
  const overviewData: ReportData = {
    period: 'January 2024',
    totalAuctions: 45,
    completedAuctions: 32,
    cancelledAuctions: 3,
    totalUsers: 1247,
    newUsers: 156,
    totalRevenue: 12450000,
    averageBidValue: 85000,
    topCategory: 'Machinery',
    participationRate: 78.5
  };

  const fetchOverview = useCallback(async () => {
    try { setError(null); setLoading(true); const data = await adminReportService.getOverview(); setOverview(data); }
    catch (e: any) { setError(e.message || 'Failed to load overview'); }
    finally { setLoading(false); }
  }, []);

  const fetchAuctionPerformance = useCallback(async (filter: 'today' | 'this_week' | 'this_month' | 'this_year') => {
    try { setError(null); setLoading(true); const list = await adminReportService.getAuctionPerformance(filter); setAuctionPerformance(list); }
    catch (e: any) { setError(e.message || 'Failed to load auction performance'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selectedReport === 'overview') fetchOverview(); }, [selectedReport, fetchOverview]);
  useEffect(() => { if (selectedReport === 'auctions') fetchAuctionPerformance(performanceFilter); }, [selectedReport, performanceFilter, fetchAuctionPerformance]);
  useEffect(() => { if (selectedReport === 'users') { (async () => { try { setError(null); setLoading(true); const list = await adminReportService.getUserActivity(userPeriod); setUserActivity(list); } catch(e: any){ setError(e.message || 'Failed to load user activity'); } finally { setLoading(false);} })(); } }, [selectedReport, userPeriod]);

  const auctionReports: AuctionReport[] = [
    
  ];

  const userReports: UserReport[] = [
    
  ];

  const categoryData = [
    { category: 'Machinery', auctions: 15, revenue: 4500000, percentage: 36 },
    { category: 'Electronics', auctions: 12, revenue: 3200000, percentage: 26 },
    { category: 'Vehicles', auctions: 8, revenue: 2800000, percentage: 22 },
    { category: 'Furniture', auctions: 7, revenue: 1200000, percentage: 10 },
    { category: 'Other', auctions: 3, revenue: 750000, percentage: 6 }
  ];

  const monthlyData = [
    { month: 'Aug', auctions: 35, revenue: 8500000 },
    { month: 'Sep', auctions: 42, revenue: 10200000 },
    { month: 'Oct', auctions: 38, revenue: 9800000 },
    { month: 'Nov', auctions: 45, revenue: 11500000 },
    { month: 'Dec', auctions: 41, revenue: 10800000 },
    { month: 'Jan', auctions: 45, revenue: 12450000 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportReport = () => {
    console.log(`Exporting ${selectedReport} report as ${exportFormat} for ${dateRange}`);
    // In real app, this would generate and download the report
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-reports-header">
        <h1>Reports & Analytics</h1>
        <div className="admin-reports-actions">
          <select
            className="control-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select
            className="control-select"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <button onClick={handleExportReport} className="control-button control-button-primary">
            <Download className="control-button-icon" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="admin-card">
        <div className="admin-card-body">
          <div className="nav-tabs">
            <button
              onClick={() => setSelectedReport('overview')}
              className={`nav-tab ${selectedReport === 'overview' ? 'nav-tab-active' : ''}`}
            >
              <BarChart className="report-icon" />
              Overview
            </button>
            <button
              onClick={() => setSelectedReport('auctions')}
              className={`nav-tab ${selectedReport === 'auctions' ? 'nav-tab-active' : ''}`}
            >
              <Gavel className="report-icon" />
              Auctions
            </button>
            <button
              onClick={() => setSelectedReport('users')}
              className={`nav-tab ${selectedReport === 'users' ? 'nav-tab-active' : ''}`}
            >
              <Users className="report-icon" />
              Users
            </button>
            
            {/* <button
              onClick={() => setSelectedReport('revenue')}
              className={`nav-tab ${selectedReport === 'revenue' ? 'nav-tab-active' : ''}`}
            >
              <IndianRupee className="report-icon" />
              Revenue
            </button> */}


            {/* 
            <button
              onClick={() => setSelectedReport('categories')}
              className={`nav-tab ${selectedReport === 'categories' ? 'nav-tab-active' : ''}`}
            >
              <PieChart className="report-icon" />
              Categories
            </button>*/}
          </div>
        </div>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="reports-container">
          {/* Key Metrics */}
          <div className="reports-section">
            <div className="reports-metrics">
              <div className="metric-card hover-lift">
                <div className="metric-header">
                  <span className="metric-title">Total Auctions</span>
                  <Gavel className="metric-icon" />
                </div>
                <div className="metric-value">{overview ? overview.totalAuctions : '—'}</div>
                <div className="metric-subtitle">Completed: {overview ? overview.completedAuctions : '—'}</div>
              </div>

              <div className="metric-card hover-lift">
                <div className="metric-header">
                  <span className="metric-title">Total Users</span>
                  <Users className="metric-icon" />
                </div>
                <div className="metric-value">{overview ? overview.totalUsers.toLocaleString() : '—'}</div>
                <div className="metric-subtitle">New: {overview ? overview.newUsers : '—'}</div>
              </div>

              <div className="metric-card hover-lift">
                <div className="metric-header">
                  <span className="metric-title">Total Revenue</span>
                  <IndianRupee className="metric-icon" />
                </div>
                <div className="metric-value">{overview ? formatCurrency(overview.totalRevenue) : '—'}</div>
                <div className="metric-subtitle">Winning Bid: {overview ? formatCurrency(overview.averageBidValue) : '—'}</div>
              </div>

              <div className="metric-card hover-lift">
                <div className="metric-header">
                  <span className="metric-title">Participation Rate</span>
                  <TrendingUp className="metric-icon" />
                </div>
                <div className="metric-value">{overview ? overview.participationRate : '—'}%</div>
                <div className="metric-subtitle">Top: {overview ? overview.topCategory : '—'}</div>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="reports-section">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Monthly Trends</h2>
              </div>
              <div className="admin-card-body">
                {monthlyData.map((month, index) => (
                  <div key={index} className="trend-item">
                    <div className="trend-header">
                      <span className="text-heading">{month.month} 2024</span>
                      <div className="text-metric">
                        <div>{month.auctions} Auctions</div>
                        <div className="text-value">{formatCurrency(month.revenue)}</div>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(month.revenue / 12450000) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auctions Report */}
      {selectedReport === 'auctions' && (
        <div className="admin-card">
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <h2 className="admin-card-title">Auction Performance Report</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select className="control-select" value={performanceFilter} onChange={e => setPerformanceFilter(e.target.value as any)}>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
              <button className="control-button" onClick={() => fetchAuctionPerformance(performanceFilter)}>Refresh</button>
            </div>
          </div>
          <div className="admin-card-body">
            {loading && <div className="text-sm text-text-white">Loading...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="table-container">
              <table className="admin-table responsive-table">
                <thead className="bg--50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">Auction Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">Auctioneer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">Financial Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">Participation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-white uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && auctionPerformance.length === 0 && !error && (
                    <tr><td colSpan={5} className="px-6 py-6 text-center text-sm text-text-white">No data for selected filter.</td></tr>
                  )}
                  {auctionPerformance.map(auction => (
                    <tr key={auction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4" data-label="Auction Details">
                        <div>
                          <div className="text-sm font-medium text-primary">{auction.title}</div>
                          <div className="text-sm text-text-white">Category: {auction.category}</div>
                          <div className="text-sm text-text-white">{new Date(auction.startDate).toLocaleDateString()} - {new Date(auction.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" data-label="Auctioneer">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{auction.auctioneer}</div>
                          <div className="text-sm text-text-white">{auction.company}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" data-label="Financial Data">
                        <div>
                          <div className="text-sm text-text-white">Base: {formatCurrency(auction.basePrice)}</div>
                          <div className="text-sm font-medium text-green-600">Final: {auction.finalPrice > 0 ? formatCurrency(auction.finalPrice) : 'N/A'}</div>
                          <div className="text-sm text-primary">Revenue: {formatCurrency(auction.revenue)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" data-label="Participation">
                        <div>
                          <div className="text-sm text-text-white">Participants: {auction.participants}</div>
                          <div className="text-sm text-text-white">Total Bids: {auction.totalBids}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" data-label="Status">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${['completed','Completed'].includes(auction.status) ? 'bg-green-100 text-green-800' : ['cancelled','Cancelled','rejected','Rejected'].includes(auction.status) ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{auction.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Report */}
      {selectedReport === 'users' && (
        <div className="admin-card">
          <div className="admin-card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
            <h2 className="admin-card-title">User Activity Report</h2>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <select className="control-select" value={userPeriod} onChange={e => setUserPeriod(e.target.value as any)}>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
              </select>
              <button className="control-button" onClick={() => setUserPeriod(p => p)}>Refresh</button>
            </div>
          </div>
          <div className="admin-card-body">
            {loading && <div className="text-sm text-text-white">Loading...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="admin-table responsive-table" style={{ width: '100%', tableLayout: 'auto', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role & Registration</th>
                    <th>Auction Activity</th>
                    <th>Financial Data</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && userActivity.length === 0 && !error && (
                    <tr><td colSpan={5} className="px-6 py-6 text-center text-sm text-text-white">No user activity data.</td></tr>
                  )}
                  {userActivity.map((user, idx) => {
                    const base = user.id && user.id.trim() !== '' ? user.id : `${user.name || 'user'}_${user.registrationDate || ''}`;
                    const safeKey = `${base.replace(/\s+/g,'_')}_${idx}`;
                    return (
                    <tr key={safeKey} className="hover:bg-gray-50">
                      <td className="px-4 py-2" data-label="User Details">
                        <div>
                          <div className="text-sm font-medium text-primary">{user.name}</div>
                          <div className="text-sm text-text-white">{user.company}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2" data-label="Role & Registration">
                        <div>
                          <div className="text-sm text-text-primary capitalize">{user.role}</div>
                          <div className="text-sm text-text-white">{user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '—'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2" data-label="Auction Activity">
                        <div>
                          <div className="text-sm text-text-white">Auctions: {user.totalAuctions}</div>
                          <div className="text-sm text-text-white">Bids: {user.totalBids}</div>
                          <div className="text-sm text-text-white">Wins: {user.winningBids}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2" data-label="Financial Data">
                        <div>
                          <div className="text-sm font-medium text-primary">{user.totalSpent > 0 ? formatCurrency(user.totalSpent) : 'N/A'}</div>
                          {user.winningBids > 0 && user.totalSpent > 0 && (
                            <div className="text-sm text-text-white">Avg: {formatCurrency(user.totalSpent / user.winningBids)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2" data-label="Status">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${['active','Active'].includes(user.status) ? 'bg-green-100 text-green-800' : ['pending','Pending'].includes(user.status) ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                      </td>
                    </tr>
                    );})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report we comment this code of Revenue button navigation */}.  
      {/* {selectedReport === 'revenue' && (
        <div className="reports-section">
          <div className="reports-grid">
            <div className="revenue-card">
              <div className="revenue-header">
                <span className="revenue-title">Total Revenue</span>
                <IndianRupee className="revenue-icon" />
              </div>
              <div className="revenue-value">{overview ? formatCurrency(overview.totalRevenue) : '—'}</div>
              <div className="revenue-trend up">
                <TrendingUp className="revenue-trend-icon" />
                <span className="revenue-trend-text">12% from last month</span>
              </div>
            </div>

            <div className="revenue-card">
              <div className="revenue-header">
                <span className="revenue-title">Average Transaction</span>
                <IndianRupee className="revenue-icon" />
              </div>
              <div className="revenue-value">{overview ? formatCurrency(overview.averageBidValue) : '—'}</div>
              <div className="revenue-trend up">
                <TrendingUp className="revenue-trend-icon" />
                <span className="revenue-trend-text">8% from last month</span>
              </div>
            </div>

            <div className="revenue-card">
              <div className="revenue-header">
                <span className="revenue-title">Commission Earned</span>
                <IndianRupee className="revenue-icon" />
              </div>
              <div className="revenue-value">{overview ? formatCurrency(overview.totalRevenue * 0.05) : '—'}</div>
              <div className="revenue-trend up">
                <TrendingUp className="revenue-trend-icon" />
                <span className="revenue-trend-text">15% from last month</span>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Revenue by Month</h2>
            </div>
            <div className="admin-card-body">
              {monthlyData.length === 0 && (
                <div className="text-sm text-text-white">No revenue by month data.</div>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Categories Report 
      {selectedReport === 'categories' && (
        <div className="reports-section">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Category Performance</h2>
            </div>
            <div className="admin-card-body">
              {categoryData.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-header">
                    <h3 className="text-value">{category.category}</h3>
                    <span className="text-metric">{category.percentage}% of total</span>
                  </div>
                  <div className="reports-metrics">
                    <div className="metric-card">
                      <div className="metric-title">Auctions</div>
                      <div className="metric-value">{category.auctions}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">Revenue</div>
                      <div className="metric-value">{formatCurrency(category.revenue)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">Avg per Auction</div>
                      <div className="metric-value">{formatCurrency(category.revenue / category.auctions)}</div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}*/}
    </div>
  );
};

export default AdminReports;
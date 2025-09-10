import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Gavel,
  Bell,
  Shield,
  BarChart3,
  User
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import './AdminDashboard.css';
// Admin Views
import AdminHome from '../AdminHome/AdminHome';
import ManageUsers from '../ManageUsers/ManageUsers';
import ManageAuctions from '../ManageAuctions/ManageAuctions';
import AdminReports from '../AdminReports/AdminReports';
import SystemSettings from '../SystemSettings/SystemSettings';

const AdminDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const navigation = useMemo(
    () => [
      { name: 'Dashboard', href: '/admin', icon: Home },
      { name: 'Manage Users', href: '/admin/users', icon: Users },
      { name: 'Manage Auctions', href: '/admin/auctions', icon: Gavel },
      { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
      { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
    []
  );

  // Sync sidebar state with viewport changes
  useEffect(() => {
    const onResize = () => {
      const nowDesktop = window.innerWidth >= 1024;
      setIsDesktop(nowDesktop);
      if (nowDesktop) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await Promise.resolve(logout());
    } catch {
      // ignored
    }
  };

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className={`admin-sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden={!isSidebarOpen}
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-hidden={!isSidebarOpen && !isDesktop}
      >
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon-wrapper">
              <Shield className="admin-logo-icon" />
            </div>
            <span className="admin-logo-text">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close sidebar"
            type="button"
          >
            <X className="admin-icon" />
          </button>
        </div>

        <nav className="admin-nav" role="navigation" aria-label="Admin main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="admin-nav-icon" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-info">
              <Shield className="admin-user-icon" />
              {/*     <span className="admin-user-role">Administrator</span>*/}
            </div>
            <div className="admin-user-name">{user?.name || 'Admin User'}</div>
            <div className="admin-user-phone">{user?.phoneNumber || ''}</div>
          </div>

          <div className="admin-switch-panel">
            <Link to="/dashboard" className="admin-switch-link" onClick={() => setIsSidebarOpen(false)}>
              <User className="admin-icon" />
              Switch to User Panel
            </Link>
          </div>

          <button onClick={handleLogout} className="admin-logout-btn" type="button">
            <LogOut className="admin-logout-icon" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main-content" role="region" aria-label="Admin main content">
        {/* Top header */}
        <header className="admin-header">
          <div className="admin-header-content">
            <button
              onClick={() => setIsSidebarOpen((o) => !o)}
              className="admin-mobile-menu"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
              type="button"
            >
              {isSidebarOpen ? <X className="admin-icon" /> : <Menu className="admin-icon" />}
            </button>

            <div className="admin-header-title">
              <h1 className="admin-page-title">
                {
                  navigation.find(
                    (nav) =>
                      location.pathname === nav.href ||
                      (nav.href !== '/admin' && location.pathname.startsWith(nav.href))
                  )?.name || 'Admin Dashboard'
                }
              </h1>
            </div>

            <div className="admin-header-actions">
              {/* Token Status Badge (Dev) */}
              <TokenStatusBadge />
              {/* Manual Admin Token Setter (Dev Only) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '360px' }}>
                <input
                  type="text"
                  placeholder="Admin token"
                  defaultValue={typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('adminToken') || '') : ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v) {
                      sessionStorage.setItem('adminToken', v);
                    } else {
                      sessionStorage.removeItem('adminToken');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    background: '#0f172a',
                    color: '#fff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    // Simple feedback + refresh pattern
                    const t = sessionStorage.getItem('adminToken');
                    console.log('Admin token set to:', t?.slice(0, 16) + '...');
                    // Force downstream components relying on fetch to re-mount by reloading
                    window.location.reload();
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    background: '#1d4ed8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >Apply</button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('adminToken');
                    window.location.reload();
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >Clear</button>
              </div>
              {/* Notifications */}
              <button
                className="admin-notification-btn"
                aria-label={`Notifications: ${unreadCount || 0} unread`}
                type="button"
              >
                <Bell className="admin-notification-icon" />
                {unreadCount > 0 && (
                  <span className="admin-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Admin indicator */}
              <div className="admin-user-indicator">
                <div className="admin-user-info">
                  <div className="admin-user-name">{user?.name || 'Admin User'}</div>
                  {/*        <div className="admin-user-role">Administrator</div>*/}
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="auctions" element={<ManageAuctions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

// Dev-only token status component
const TokenStatusBadge: React.FC = () => {
  const [info, setInfo] = useState<{ present: boolean; exp?: number; ttl?: number; expired?: boolean; part?: string }>(() => ({ present: false }));

  useEffect(() => {
    try {
      const tok = sessionStorage.getItem('adminToken') || (() => {
        // fallback search for admin_token* keys
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (k.startsWith('admin_token')) return sessionStorage.getItem(k);
        }
        return null;
      })();
      if (!tok) { setInfo({ present: false }); return; }
      const parts = tok.split('.');
      if (parts.length === 3) {
        let payload: any = {};
        try { payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { /* ignore */ }
        const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
        const now = Date.now() / 1000;
        const expired = exp ? now >= exp : false;
        const ttl = exp ? Math.max(0, exp - now) : undefined;
        setInfo({ present: true, exp, expired, ttl, part: parts[0] + '..' + parts[2].slice(-6) });
      } else {
        setInfo({ present: true, expired: false, part: tok.slice(0, 8) + '...' });
      }
    } catch {
      setInfo({ present: false });
    }
  }, []);

  const color = !info.present ? '#64748b' : info.expired ? '#dc2626' : '#16a34a';
  const label = !info.present ? 'No Admin Token' : info.expired ? 'Token Expired' : 'Token Active';
  const ttlStr = info.ttl !== undefined ? (info.ttl > 3600 ? Math.floor(info.ttl / 3600) + 'h' : Math.ceil(info.ttl / 60) + 'm') : '';

  return (
    <div title={`Admin Token Status\n${label}${info.exp ? `\nexp=${new Date((info.exp || 0) * 1000).toLocaleString()}` : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: '#1e293b',
        border: `1px solid ${color}`,
        padding: '4px 8px',
        borderRadius: 6,
        fontSize: '0.65rem',
        lineHeight: 1,
        color: color,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
      }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span>{label}</span>
      {ttlStr && !info.expired && <span style={{ color: '#94a3b8' }}>({ttlStr})</span>}
    </div>
  );
};
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Auctions', href: '/dashboard/auctions' },
    { name: 'New Auction', href: '/dashboard/new-auction' },
    { name: 'Reports', href: '/dashboard/reports' },
    { name: 'My Profile', href: '/dashboard/profile' },
  ];

  const getCurrentPageName = () => {
    const currentNav = navigation.find(nav =>
      location.pathname === nav.href ||
      (nav.href !== '/dashboard' && location.pathname.startsWith(nav.href))
    );
    return currentNav?.name || 'Dashboard';
  };

  return (
    <header className="ap-dashboard-header">
      <div className="ap-dashboard-header-content">
        <button
          onClick={onMenuClick}
          className="ap-dashboard-menu-btn"
          aria-label="Open sidebar"
          aria-controls="dashboard-sidebar"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="ap-dashboard-menu-icon" />
        </button>

        <div className="ap-dashboard-header-title">
          <h1 className="ap-dashboard-page-title">
            {getCurrentPageName()}
          </h1>
        </div>

        <div className="ap-dashboard-header-actions">
          {/* Notifications */}
          <button className="ap-dashboard-notification-btn">
            <Bell className="ap-dashboard-notification-icon" />
            {unreadCount > 0 && (
              <span className="ap-dashboard-notification-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User menu - for larger screens */}
          <div className="ap-dashboard-user-menu">
            <div className="ap-dashboard-user-info">
              <div className="ap-dashboard-user-name">
                {user?.name || 'User'}
              </div>
              {/*<div className="ap-dashboard-user-role">
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </div>*/}
            </div>
            <div className="ap-dashboard-user-avatar">
              <User className="ap-dashboard-user-icon" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Calendar,
  User,
  FileText,
  LogOut,
  X,
  Gavel
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Auctions', href: '/dashboard/auctions', icon: Gavel },
    { name: 'New Auction', href: '/dashboard/new-auction', icon: Plus },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`ap-sidebar ${isOpen ? 'ap-sidebar-open' : 'ap-sidebar-closed'}`}
      aria-hidden={!isOpen && window.innerWidth < 1024}
      id="dashboard-sidebar"
    >
      {/* Sidebar Header */}
      <div className="ap-sidebar-header">
        <div className="ap-sidebar-logo-section">
          <div className="ap-sidebar-logo-badge">
            <Gavel className="ap-sidebar-logo-icon" />
          </div>
          <span className="ap-sidebar-brand-title" id="setsidebar">Quickauction</span>
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="ap-sidebar-close-btn"
          aria-label="Close sidebar"
        >
          <X
            className="ap-sidebar-close-icon"
            style={{ color: 'red', cursor: 'pointer' }}
          />
        </button>

      </div>

      {/* Navigation Menu */}
      <nav className="ap-sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`ap-sidebar-nav-link ${isActive ? 'ap-sidebar-nav-link-active' : ''}`}
              onClick={() => {
                if (window.innerWidth < 1024) {  // only close on smaller screens
                  onClose();
                }
              }}
            >

              <Icon className="ap-sidebar-nav-icon" />
              <span className="ap-sidebar-nav-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="ap-sidebar-footer">
        {/* User Info */}
        <div className="ap-sidebar-user-info">
          <div className="ap-sidebar-user-name">
            {user?.personName || user?.name || 'User'}
          </div>
          <div className="ap-sidebar-user-company">
            {user?.companyName || 'No Company'}
          </div>
          <div className="ap-sidebar-user-phone">
            {user?.phoneNumber}
          </div>
          <div className="ap-sidebar-user-role">
            {user?.role === 'admin' ? 'Administrator' :
              user?.role === 'auctioneer' ? 'Auctioneer' :
                user?.role === 'participant' ? 'Participant' : 'User'}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ap-sidebar-logout-btn"
        >
          <LogOut className="ap-sidebar-logout-icon" />
          <span className="ap-sidebar-logout-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import './Dashboard.css';
import Sidebar from '../Sidebar/Sidebar';

// Dashboard Views
import DashboardHome from '../DashboardHome/DashboardHome';
import MyAuction from '../MyAuctions/MyAuctions';
import NewAuction from '../NewAuction/NewAuction';
import ViewAuction from '../ViewAuction/ViewAuction';
import JoinAuction from '../JoinAuction/JoinAuction';
import MyProfile from '../MyProfile/MyProfile';
import AuctionReports from '../AuctionReports/AuctionReports';
import DashboardHeader from './DashboardHeader';

// Participant Components
import ParticipantAuctionSession from '../../Participant/AuctionSession/ParticipantAuctionSession';

// Auctioneer Components
import AuctioneerLiveView from '../../Auctioneer/LiveAuction/AuctioneerLiveView';

// Test Components
import TimersAPITest from '../../TimersAPITest/TimersAPITest';

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="ap-dashboard">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="ap-dashboard-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="ap-dashboard-main">
        {/* Top header */}
        <DashboardHeader 
          onMenuClick={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page content */}
        <main className="ap-dashboard-content">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="auctions" element={<MyAuction />} />
            <Route path="new-auction" element={<NewAuction />} />
            <Route path="auction/:id" element={<ViewAuction />} />
            <Route path="join" element={<JoinAuction />} />
            <Route path="join/:id" element={<JoinAuction />} />
            <Route path="auction-session/:id" element={<ParticipantAuctionSession />} />
            <Route path="participant-auction/:id" element={<ParticipantAuctionSession />} />
            <Route path="auctioneer-live/:id" element={<AuctioneerLiveView />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="reports" element={<AuctionReports />} />
            <Route path="timers-test" element={<TimersAPITest />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

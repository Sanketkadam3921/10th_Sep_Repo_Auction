# Auction_Pro- React.js

A comprehensive auction_pro built with React.js, featuring user authentication, dual-role system (Auctioneer + Participant), real-time bidding, and admin panel.

## 🚀 Features

### Authentication System
- **Phone-based Authentication**: Login with phone number and OTP verification
- **SMS Integration**: Automated SMS notifications (Type 1: OTP, Type 2: Reminders, Type 3: Pre-bid requests)
- **Forgot Password**: Password reset via SMS OTP

### User Panel (Dual Role System)
- **Single Login**: Users can act as both Auctioneer and Participant
- **My Auctions**: View upcoming scheduled auctions in both roles
- **My Profile**: Complete profile management with optional fields
- **Real-time Bidding**: Live countdown timers with auto-extension
- **Auction Management**: Create, manage, and participate in auctions

### Auctioneer Features
- **New Auction Creation**: 
  - Set auction date/time (default: tomorrow, 12:00 PM Delhi)
  - Duration options (15 Min, 30 Min, 1 Hr, 2 Hr)
  - Currency selection (INR/USD)
  - Open to all companies or invite-only
  - Product details and documentation upload
  - Pre-bid offer settings
  - Participant management

- **Auction Management**:
  - View auction participants
  - Monitor live bidding
  - Access comprehensive reports
  - Download auction documents

### Participant Features
- **Join Auctions**: Participate in open or invited auctions
- **Live Bidding**: Real-time bid placement with decremental value rules
- **Pre-bid Submission**: Submit offers before auction starts
- **Bid Tracking**: View live rankings (L1, L2, L3...)

### Admin Panel
- **User Management**: Approve, block, or remove users
- **Auction Oversight**: Approve/reject auction creation requests
- **System Monitoring**: Real-time auction monitoring
- **Reports & Analytics**: Access all auction reports and analytics
- **Settings Management**: Configure system settings, SMS templates, currencies

### Reporting System
- **Comprehensive Reports**: Detailed auction summaries
- **Bid Analysis**: Complete bid history and rankings
- **Export Functionality**: Download reports in various formats
- **Real-time Analytics**: Live auction monitoring and statistics

## 🛠️ Technical Stack

- **Frontend**: React.js 18+ with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: Custom CSS with utility classes
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **State Management**: React Context API
- **Date Handling**: date-fns

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginPage.tsx
│   │   ├── OTPVerification.tsx
│   │   └── ForgotPassword.tsx
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── DashboardHome.tsx
│   │   ├── MyAuctions.tsx
│   │   ├── NewAuction.tsx
│   │   ├── ViewAuction.tsx
│   │   ├── JoinAuction.tsx
│   │   ├── MyProfile.tsx
│   │   └── AuctionReports.tsx
│   ├── Admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminHome.tsx
│   │   ├── ManageUsers.tsx
│   │   ├── ManageAuctions.tsx
│   │   ├── AdminReports.tsx
│   │   └── SystemSettings.tsx
│   ├── LandingPage/
│   │   └── LandingPage.tsx
│   └── Common/
│       └── LoadingSpinner.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── App.tsx
├── index.tsx
└── index.css
```

# Auction_Pro - React.js

A comprehensive auction_pro built with React.js, featuring user authentication, dual-role system (Auctioneer + Participant), real-time bidding, and admin panel.

## 🚀 Quick Start

### Option 1: View Demo (No Installation Required)
Open `demo.html` in your browser to see the working landing page and feature overview.

### Option 2: Full React Application
```bash
# Install dependencies (requires disk space)
npm install

# Start development server
npm start

# Open http://localhost:3000
```

## ⚠️ Current Status

**✅ COMPLETED:**
- Complete React.js project structure
- All components created and properly organized
- TypeScript configuration
- Custom CSS with responsive design
- Authentication context and logic
- Dashboard layout and navigation
- Admin panel structure
- Landing page with demo version
- Comprehensive documentation

**⚠️ PENDING:**
- Dependencies installation (due to disk space constraints)
- Final compilation and testing

## 🎯 Demo Instructions

### For HTML Demo (`demo.html`):
- No installation required
- Shows complete UI design and features
- Responsive design demonstration
- All styling and layout working

### For React App (after `npm install`):
1. **Login**: Use any 10-digit Indian phone number
2. **Admin Access**: Use `+919999999999`
3. **OTP**: Any 6-digit number works in demo
4. **Features**: All UI components ready for backend integration

## 🎨 Features Highlights

### Real-time Bidding
- Live countdown timers
- Auto-extension (3 minutes if bid in last 3 minutes)
- Decremental value enforcement
- Live bid rankings (L1, L2, L3...)

### SMS Notifications
- **Type 1**: OTP messages for authentication
- **Type 2**: Auction reminders (10 minutes before start)
- **Type 3**: Pre-bid submission requests

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interfaces
- Optimized for both desktop and mobile

### User Experience
- Intuitive navigation
- Clear visual feedback
- Loading states and error handling
- Comprehensive form validation

## 🔧 Configuration

### SMS Templates (Admin configurable)
```javascript
// Type 1 - OTP
"OTP for XXXX is for joining Auction website"

// Type 2 - Reminder  
"Auction will start in ten minutes, please join accordingly + Auction Details"

// Type 3 - Pre-bid Request
"Please submit Pre Bid on Auction Website to join Auction + Website/App link"
```

### Default Settings
- **Auction Date**: Tomorrow
- **Start Time**: 12:00 PM (Delhi timezone)
- **Duration**: 2 Hours
- **Currency**: INR
- **Open to All**: Yes
- **Auto-extension**: 3 minutes

## 🎯 Future Enhancements

- Real backend API integration
- WebSocket for real-time bidding
- Payment gateway integration
- Advanced reporting and analytics
- Mobile app development
- Multi-language support
- Email notifications
- Advanced filtering and search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@auctionpro.com
- Phone: +91 98765 43210

---

Built with ❤️ using React.js

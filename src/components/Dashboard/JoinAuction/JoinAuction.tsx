import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './JoinAuction.css';
import { 
  Timer, 
  Users, 
  TrendingDown, 
  Send,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  Crown,
  Medal,
  Award,
  Search,
  Filter,
  Calendar,
  Play,
  Eye,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AuctionService from '../../../services/auctionService';
import { ParticipantRegistrationData } from '../../../types/auction';

interface AvailableAuction {
  id: string;
  auctionNo: string;
  auctionDate: string;
  auctionStartTime: string;
  duration: number;
  currency: 'INR' | 'USD';
  title: string;
  description: string;
  category: string;
  status: 'upcoming' | 'live' | 'completed';
  startingPrice: number;
  decrementalValue: number;
  registrationDeadline: string;
  
  // Auctioneer Details
  auctioneerCompany: {
    name: string;
    address: string;
  };
  
  // Participation Info
  totalParticipants: number;
  isRegistered: boolean;
  canJoin: boolean;
}

const JoinAuction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<AvailableAuction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<AvailableAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [joiningAuction, setJoiningAuction] = useState<string | null>(null);
  const { user } = useAuth();

  // If an ID is provided, redirect to the auction session
  useEffect(() => {
    if (id) {
      navigate(`/dashboard/auction-session/${id}`);
      return;
    }
  }, [id, navigate]);

  useEffect(() => {
    loadAvailableAuctions();
  }, []);

  useEffect(() => {
    filterAuctions();
  }, [auctions, searchTerm, statusFilter]);

  const loadAvailableAuctions = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock available auctions data
      const mockAuctions: AvailableAuction[] = [
                
      ];
      
      setAuctions(mockAuctions);
      
    } catch (error) {
      toast.error('Failed to load available auctions');
    } finally {
      setLoading(false);
    }
  };

  const filterAuctions = () => {
    let filtered = auctions;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(auction => 
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.auctionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.auctioneerCompany.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(auction => auction.status === statusFilter);
    }
    
    setFilteredAuctions(filtered);
  };

  const handleJoinAuction = async (auctionId: string) => {
    if (!user) {
      toast.error('Please login to join auctions');
      return;
    }

    setJoiningAuction(auctionId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock registration
      const participantData: ParticipantRegistrationData = {
        auctionId,
        phoneNumber: user.phoneNumber || '+91-9876543210',
        companyName: user.companyName || 'Your Company',
        companyAddress: user.companyAddress || 'Your Address',
        personName: user.personName || user.name || 'Your Name',
        mailId: user.mailId || user.email || 'your@email.com',
        preBidOffer: undefined
      };

      // Update local state
      setAuctions(prev => prev.map(auction => 
        auction.id === auctionId 
          ? { ...auction, isRegistered: true, totalParticipants: auction.totalParticipants + 1 }
          : auction
      ));

      toast.success('Successfully registered for the auction!');
      
      // Navigate to auction session after successful registration
      setTimeout(() => {
        navigate(`/dashboard/auction-session/${auctionId}`);
      }, 1000);
      
    } catch (error) {
      toast.error('Failed to join auction. Please try again.');
    } finally {
      setJoiningAuction(null);
    }
  };

  const handleViewAuction = (auctionId: string) => {
    navigate(`/dashboard/auction-session/${auctionId}`);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status) {
      case 'live':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'upcoming':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getActionButton = (auction: AvailableAuction) => {
    if (auction.status === 'completed') {
      return (
        <button
          onClick={() => handleViewAuction(auction.id)}
          className="btn btn-secondary"
        >
          <Eye className="w-4 h-4" />
          View Results
        </button>
      );
    }

    if (auction.isRegistered) {
      if (auction.status === 'live') {
        return (
          <button
            onClick={() => handleViewAuction(auction.id)}
            className="btn btn-success"
          >
            <Play className="w-4 h-4" />
            Join Live Auction
          </button>
        );
      } else {
        return (
          <button
            onClick={() => handleViewAuction(auction.id)}
            className="btn btn-primary"
          >
            <Eye className="w-4 h-4" />
            View Auction
          </button>
        );
      }
    }

    if (auction.canJoin) {
      return (
        <button
          onClick={() => handleJoinAuction(auction.id)}
          disabled={joiningAuction === auction.id}
          className="btn btn-primary"
        >
          {joiningAuction === auction.id ? (
            <div className="loading-spinner" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Register for Auction
            </>
          )}
        </button>
      );
    }

    return (
      <button className="btn btn-secondary" disabled>
        Registration Closed
      </button>
    );
  };

  if (loading) {
    return (
      <div className="join-auction-loading">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>Loading available auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-auction-container">
      {/* Header */}
      <div className="join-auction-header">
        <div>
          <h1 className="join-auction-title">
            <Users className="w-6 h-6" />
            Available Auctions
          </h1>
          <p className="join-auction-subtitle">
            Discover and participate in ongoing and upcoming auctions
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-container">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search auctions by title, category, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Auctions Grid */}
      <div className="auctions-grid">
        {filteredAuctions.length === 0 ? (
          <div className="no-auctions-card">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3>No Auctions Found</h3>
            <p>No auctions match your current search criteria.</p>
          </div>
        ) : (
          filteredAuctions.map((auction) => (
            <div key={auction.id} className="auction-card">
              <div className="auction-card-header">
                <div className="auction-title-row">
                  <h3 className="auction-title">{auction.title}</h3>
                  <span className={getStatusBadge(auction.status)}>{auction.status}</span>
                </div>
                <p className="auction-number">Auction #{auction.auctionNo}</p>
              </div>

              <div className="auction-card-body">
                <p className="auction-description">{auction.description}</p>
                
                <div className="auction-details-grid">
                  <div className="detail-item">
                    <label>Category</label>
                    <span>{auction.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Starting Price</label>
                    <span className="price">₹{auction.startingPrice.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Min. Reduction</label>
                    <span className="price">₹{auction.decrementalValue.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Duration</label>
                    <span>{auction.duration} minutes</span>
                  </div>
                </div>

                <div className="auctioneer-info">
                  <h4>
                    <Building className="w-4 h-4" />
                    Auctioneer Company
                  </h4>
                  <div className="company-details">
                    <p className="company-name">{auction.auctioneerCompany.name}</p>
                  <p className="company-address">
                      <MapPin className="w-3 h-3" />
                      {auction.auctioneerCompany.address}
                    </p>
                  </div>
                </div>

                <div className="schedule-info">
                  <div className="schedule-item">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(auction.auctionDate), 'MMM dd, yyyy')} at {auction.auctionStartTime}
                    </span>
                  </div>
                  <div className="schedule-item">
                    <Clock className="w-4 h-4" />
                    <span>
                      Registration until {format(new Date(auction.registrationDeadline), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="auction-card-footer">
                <div className="participants-info">
                  <Users className="w-4 h-4" />
                  <span>{auction.totalParticipants} participants</span>
                  {auction.isRegistered && (
                    <span className="registered-badge">Registered</span>
                  )}
                </div>
                
                {getActionButton(auction)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JoinAuction;

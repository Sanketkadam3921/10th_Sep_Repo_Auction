import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ParticipantAuctionSession.css';
import { 
  Timer, 
  Users, 
  IndianRupee, 
  TrendingDown, 
  Send,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  Crown,
  Medal,
  Award,
  Info,
  Activity,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AuctionService from '../../../services/auctionService';
import apiAuctionService from '../../../services/apiAuctionService';
import newAuctionService from '../../../services/newAuctionService';
import auctionTimerService, { TimerData } from '../../../services/auctionTimerService';
import { BaseAuction, AuctionParticipant } from '../../../types/auction';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ParticipantAuctionSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [auction, setAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extendedCount, setExtendedCount] = useState(0);
  const [extensionMessage, setExtensionMessage] = useState<string>('');
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null); // Store user details from token
  // Pre-bid modal state
  const [showPreBidModal, setShowPreBidModal] = useState(false);
  const [preBidInput, setPreBidInput] = useState<string>('');
  const [preBidError, setPreBidError] = useState<string | null>(null);

  // Time formatting functions
  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    return { days, hours, minutes, seconds };
  };

  const getAuctionStart = (auction: BaseAuction) => {
    return new Date(`${auction.auctionDate}T${auction.auctionStartTime}:00`);
  };

  const getAuctionEnd = (auction: BaseAuction) => {
    const start = getAuctionStart(auction);
    // Backend returns duration in seconds for live auctions, but we need milliseconds
    // For upcoming auctions, duration might be in minutes, so convert appropriately
    const durationMs = auction.status === 'live' 
      ? auction.duration * 1000  // seconds to milliseconds
      : auction.duration * 60000; // minutes to milliseconds
    
    console.log(`[ParticipantAuctionSession] Duration calculation:`, {
      status: auction.status,
      rawDuration: auction.duration,
      durationMs,
      isLive: auction.status === 'live'
    });
    
    const end = new Date(start.getTime() + durationMs);
    return end;
  };

  useEffect(() => {
    loadAuctionData();
    fetchUserDetails(); // Fetch user details when component loads
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("https://auction-development.onrender.com/api/auth/profile", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setUserDetails(result.user);
          console.log('[ParticipantAuctionSession] User details fetched:', result.user);
        }
      }
    } catch (error) {
      console.error('[ParticipantAuctionSession] Failed to fetch user details:', error);
    }
  };

  // Subscribe to real-time timer updates
  useEffect(() => {
    if (!id) return;
    
    console.log('[ParticipantAuctionSession] Subscribing to timer updates for auction:', id);
    const unsubscribe = auctionTimerService.subscribe(id, (data: TimerData) => {
      console.log('[ParticipantAuctionSession] Timer update received:', data);
      setTimerData(data);
      
      // Update auction status based on timer data
      if (auction) {
        const newStatus = data.status.toLowerCase() as 'upcoming' | 'live' | 'completed';
        if (auction.status !== newStatus) {
          // When auction transitions to live, refresh data from backend to get live duration
          if (newStatus === 'live' && auction.status === 'upcoming') {
            console.log('[ParticipantAuctionSession] Auction went live, refreshing data for live duration');
            refreshAuctionData();
            toast.success('Auction is now live!');
          } else if (newStatus === 'completed') {
            toast.success('Auction has ended!');
          } else if (newStatus === 'live') {
            toast.success('Auction is now live!');
          }
          
          setAuction(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    });
    
    return unsubscribe;
  }, [id, auction?.status]);

  // Refresh auction data from backend (for live duration updates)
  const refreshAuctionData = async () => {
    if (!id) return;
    
    try {
      console.log('[ParticipantAuctionSession] Refreshing auction data for live duration');
      const API_BASE_URL = "https://auction-development.onrender.com/api/auction";
      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("accessToken");
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.auction) {
          const rawAuction = result.auction;
          
          // Update auction with fresh backend data, especially duration for live status
          setAuction(prev => {
            if (!prev) return prev;
            
            const updatedAuction = {
              ...prev,
              // Backend returns duration in seconds for live auctions, convert to minutes for display
              duration: rawAuction.status === 'live' 
                ? Math.round(rawAuction.duration / 60) || prev.duration  // seconds to minutes
                : rawAuction.duration || prev.duration, // already in minutes for upcoming
              auctionStartTime: rawAuction.formatted_start_time || rawAuction.start_time || prev.auctionStartTime,
              auctionEndTime: rawAuction.formatted_end_time || rawAuction.end_time || prev.auctionEndTime,
              decrementalValue: parseFloat(rawAuction.decremental_value) || prev.decrementalValue,
              startingPrice: parseFloat(rawAuction.current_price) || prev.startingPrice,
              preBidOfferAllowed: rawAuction.pre_bid_allowed === 1,
              status: (rawAuction.status as 'upcoming' | 'live' | 'completed') || prev.status
            };
            
            // Update backend metadata
            (updatedAuction as any).backend = {
              ...(prev as any).backend,
              ...rawAuction,
              user: result.user,
              bidHistory: rawAuction.bids || (prev as any).backend?.bidHistory || [],
              participantsList: rawAuction.participants || (prev as any).backend?.participantsList || [],
              currentPrice: parseFloat(rawAuction.current_price) || (prev as any).backend?.currentPrice || 0,
              statistics: rawAuction.statistics || (prev as any).backend?.statistics || {}
            };
            
            console.log('[ParticipantAuctionSession] Updated auction with live data:', updatedAuction);
            return updatedAuction;
          });
        }
      }
    } catch (error) {
      console.error('[ParticipantAuctionSession] Failed to refresh auction data:', error);
    }
  };

  useEffect(() => {
    if (!auction) return;

    // Update countdown every second
    const timer = setInterval(() => {
      let remaining: number;
      // Prefer API timer data if it matches state
      if (timerData && typeof timerData.time_remaining === 'number') {
        remaining = timerData.time_remaining;
      } else {
        const now = new Date();
        if (auction.status === 'upcoming') {
          const startTime = getAuctionStart(auction);
          remaining = Math.max(0, startTime.getTime() - now.getTime());
          
          // Check if auction should transition to live
          if (remaining <= 0) {
            console.log('[ParticipantAuctionSession] Auction time reached, refreshing for live status');
            refreshAuctionData();
          }
        } else if (auction.status === 'live') {
          const endTime = getAuctionEnd(auction);
          remaining = Math.max(0, endTime.getTime() - now.getTime());
          
          // Check if auction should transition to completed
          if (remaining <= 0) {
            setAuction(prev => prev ? { ...prev, status: 'completed' } : null);
            toast.success('Auction has ended!');
          }
        } else {
          remaining = 0;
        }
      }
      
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction, timerData]);

  // Load participants every 3 seconds to simulate real-time updates
  useEffect(() => {
    if (!auction || auction.status !== 'live') return;

    const participantTimer = setInterval(() => {
      if (id) {
        const updatedParticipants = AuctionService.getAuctionParticipants(id);
        setParticipants(updatedParticipants);
      }
    }, 3000);

    return () => clearInterval(participantTimer);
  }, [auction, id]);

  const loadAuctionData = async () => {
    try {
      setLoading(true);
      console.log('[ParticipantAuctionSession] Loading auction data for ID:', id);
      
      if (!id) {
        throw new Error('Auction ID not found');
      }
      let auctionData: BaseAuction | null = null;
      
      // Try new auction details API first
      try {
        console.log('[ParticipantAuctionSession] Attempting backend fetch for auction:', id);
        const API_BASE_URL = "https://auction-development.onrender.com/api/auction";
        const token = localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("accessToken");
        
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.auction) {
            const rawAuction = result.auction;
            
            console.log(`[ParticipantAuctionSession] Backend API response:`, {
              status: rawAuction.status,
              rawDuration: rawAuction.duration,
              convertedDuration: rawAuction.status === 'live' ? Math.round(rawAuction.duration / 60) : rawAuction.duration
            });
            
            // Map the new API response to BaseAuction format
            auctionData = {
              id: rawAuction.id?.toString() || id,
              backendId: rawAuction.id?.toString(),
              title: rawAuction.title || '',
              auctionNo: rawAuction.auction_no || '',
              auctionDate: rawAuction.auction_date || '',
              auctionStartTime: rawAuction.formatted_start_time || rawAuction.start_time || '',
              auctionEndTime: rawAuction.formatted_end_time || rawAuction.end_time || '',
              // Backend returns duration in seconds for live auctions, convert to minutes for display
              duration: rawAuction.status === 'live' 
                ? Math.round(rawAuction.duration / 60) || 0  // seconds to minutes
                : rawAuction.duration || 0, // already in minutes for upcoming
              currency: rawAuction.currency as 'INR' | 'USD' || 'INR',
              auctionDetails: rawAuction.description || '',
              openToAllCompanies: true, // Default assumption
              preBidOfferAllowed: rawAuction.pre_bid_allowed === 1,
              decrementalValue: parseFloat(rawAuction.decremental_value) || 0,
              startingPrice: parseFloat(rawAuction.current_price) || 0,
              reservePrice: undefined,
              status: rawAuction.status as 'upcoming' | 'live' | 'completed',
              participants: rawAuction.participants?.map((p: any) => p.phone_number || p.user_id?.toString()) || [],
              documents: rawAuction.documents || [],
              createdBy: rawAuction.created_by?.toString() || '',
              createdAt: rawAuction.created_at || '',
              updatedAt: rawAuction.updated_at || ''
            } as BaseAuction;
            
            // Store raw backend data for additional fields
            (auctionData as any).backend = {
              ...rawAuction,
              user: result.user, // Store the user/creator info from the API response
              bidHistory: rawAuction.bids || [],
              participantsList: rawAuction.participants || [],
              currentPrice: parseFloat(rawAuction.current_price) || 0,
              statistics: rawAuction.statistics || {}
            };
            console.log('[ParticipantAuctionSession] New API fetch successful:', auctionData);
          }
        } else if (response.status === 403) {
          // 403 is expected for participants who don't have direct access - silently continue to fallback
          console.log('[ParticipantAuctionSession] Direct API returned 403 (expected for participants), using fallback');
        }
      } catch (newApiErr: any) {
        // Only log non-403 errors to avoid console spam
        if (!newApiErr?.message?.includes('403') && !newApiErr?.message?.includes('Forbidden')) {
          console.warn('[ParticipantAuctionSession] New auction details API failed, trying legacy:', newApiErr);
        } else {
          console.log('[ParticipantAuctionSession] Direct API access denied (expected for participants), using fallback');
        }
      }
      
      // Fallback to legacy API if new API failed
      if (!auctionData) {
        try {
          auctionData = await apiAuctionService.fetchAuctionById(id);
          console.log('[ParticipantAuctionSession] Legacy API fetch successful:', auctionData);
        } catch (apiErr: any) {
          // Only log non-403 errors to avoid console spam for expected permission issues
          if (!apiErr?.message?.includes('403') && !apiErr?.message?.includes('Forbidden')) {
            console.warn('Legacy API fetch failed, falling back to local storage:', apiErr);
          } else {
            console.log('[ParticipantAuctionSession] API access denied, trying local storage fallback');
          }
          auctionData = AuctionService.getAuctionById(id);
        }
      }
      
      if (!auctionData) {
        console.error('[ParticipantAuctionSession] No auction data found');
        throw new Error('Auction not found');
      }

      // Attempt to join (idempotent) so backend recognizes participant
      try {
        console.log('[ParticipantAuctionSession] Attempting to join as participant (new API)');
        const auctionIdNum = Number(id);
        if (!isNaN(auctionIdNum) && user?.phoneNumber) {
          const joinResult = await newAuctionService.joinAuction({
            auction_id: auctionIdNum,
            phone_number: user.phoneNumber,
          });
          console.log('[ParticipantAuctionSession] Join result (new API):', joinResult);
        } else {
          // Fallback: old API if we don't have a numeric backend id or phone
          console.log('[ParticipantAuctionSession] Falling back to legacy joinParticipant');
          const legacy = await apiAuctionService.joinParticipant(id);
          console.log('[ParticipantAuctionSession] Join result (legacy):', legacy);
        }
      } catch (joinErr: any) {
        console.error('[ParticipantAuctionSession] Join failed:', joinErr);
        if (!/already/i.test(joinErr?.message || '')) {
          console.warn('[ParticipantAuctionSession] join attempt failed (continuing)', joinErr);
        }
      }

      setAuction(auctionData);

      // Load participants (backend if possible)
      try {
        const backendParticipants = await apiAuctionService.fetchParticipants(id).catch(()=> null);
        if (backendParticipants && Array.isArray(backendParticipants.participants) && backendParticipants.participants.length) {
          // Map minimal backend structure to AuctionParticipant shape if needed
          const mapped = backendParticipants.participants.map((p:any, idx:number) => ({
            id: String(p.id || idx),
            auctionId: id,
            userId: String(p.user_id || p.userId || p.phone_number || p.phoneNumber || idx),
            userName: p.person_name || p.personName || p.company_name || 'Participant',
            userPhone: p.phone_number || p.phoneNumber || '',
            phoneNumber: p.phone_number || p.phoneNumber || '',
            companyName: p.company_name || p.companyName || 'Company',
            companyAddress: p.company_address || p.companyAddress || '',
            personName: p.person_name || p.personName || '',
            mailId: p.email || p.mailId || '',
            bidAmount: p.amount ? Number(String(p.amount).replace(/[^0-9.]/g,'')) : (auctionData?.startingPrice || 0),
            lastBidTime: p.bid_time || p.lastBidTime || new Date().toISOString(),
            joinedAt: p.joined_at || p.joinedAt || new Date().toISOString(),
            status: p.status || 'joined'
          }));
          setParticipants(mapped);
        } else {
          const localParticipants = AuctionService.getAuctionParticipants(id);
          setParticipants(localParticipants);
        }
      } catch (pErr) {
        console.warn('[ParticipantAuctionSession] fetchParticipants failed', pErr);
        const localParticipants = AuctionService.getAuctionParticipants(id);
        setParticipants(localParticipants);
      }
      
      // Set initial bid amount (current lowest - decremental value)
      const currentLowest = (participants.length > 0 ? Math.min(...participants.map((p: AuctionParticipant) => p.bidAmount)) : (auctionData.startingPrice || 0));
        
      setBidAmount((currentLowest - (auctionData.decrementalValue || 1000)).toString());
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load auction data');
      setTimeout(() => navigate('/dashboard/auctions'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!auction || !user || !bidAmount) return;
    
    const bidValue = parseFloat(bidAmount);
    const currentLowest = participants.length > 0 
      ? Math.min(...participants.map(p => p.bidAmount))
      : auction.startingPrice || 0;
    
    // Validation
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    if (bidValue >= currentLowest) {
      toast.error('Your bid must be lower than the current lowest price');
      return;
    }
    
    if (auction.decrementalValue && 
        (currentLowest - bidValue) < auction.decrementalValue) {
      toast.error(`Bid must be at least ₹${auction.decrementalValue} lower than current lowest price`);
      return;
    }

    if (auction.reservePrice && bidValue < auction.reservePrice) {
      toast.error(`Bid cannot be lower than reserve price of ₹${auction.reservePrice.toLocaleString()}`);
      return;
    }
    
    setIsSubmittingBid(true);
    
    try {
      // Try backend bid API first
      const rawId = (auction as any).backendId || id || auction.id;
      const auctionIdNum = Number(rawId);
      let placed = false;
      if (!isNaN(auctionIdNum)) {
        try {
          const res = await newAuctionService.placeBid({
            auction_id: auctionIdNum,
            amount: bidValue,
          });
          console.log('[ParticipantAuctionSession] placeBid result:', res);
          placed = !!res?.success;
        } catch (apiErr) {
          console.warn('[ParticipantAuctionSession] Backend bid failed, will fallback to local update', apiErr);
        }
      }

      // Check if bid was placed in last 3 minutes - auto-extend
      if (timeLeft <= 3 * 60 * 1000 && auction.status === 'live') {
        setExtendedCount(prev => prev + 1);
        setExtensionMessage('Auction extended by 3 minutes due to bid in last 3 minutes');
        toast.success('🎉 Bid submitted! Auction extended by 3 minutes');
      } else {
        toast.success('✅ Bid submitted successfully!');
      }
      
      // Create/update participant record for this bid
      const newParticipant: AuctionParticipant = {
        id: Date.now().toString(),
        auctionId: auction.id,
        userId: user.id,
        userName: user.personName,
        userPhone: user.phoneNumber,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        personName: user.personName,
        mailId: user.mailId,
        bidAmount: bidValue,
        lastBidTime: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        status: 'approved'
      };
      
      setParticipants(prev => [
        newParticipant,
        ...prev.filter(p => p.userId !== user.id)
      ]);
      
      // Reset bid amount for next bid
      setBidAmount((bidValue - (auction.decrementalValue || 1000)).toString());
      
    } catch (error) {
      toast.error('Failed to submit bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-200 rounded-full">{rank}</span>;
    }
  };

  const getCurrentLowest = () => {
    if (participants.length > 0) return Math.min(...participants.map(p => p.bidAmount));
    const backendMeta: any = (auction as any)?.backend || {};
    return (
      backendMeta.currentPrice ??
      auction?.reservePrice ??
      backendMeta.basePrice ??
      auction?.startingPrice ??
      0
    );
  };

  // Format date like ViewAuction
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Save Pre-Bid (same logic as ViewAuction)
  const handleSavePreBid = async () => {
    if (!auction || !user) return;
    const val = Number(preBidInput);
    const max = auction?.decrementalValue;
    if (isNaN(val) || val <= 0) {
      setPreBidError('Enter a valid number');
      return;
    }
    // Allow pre-bid when auction is upcoming or live
    const isPreBidWindowOpen = auction.status === 'upcoming' || auction.status === 'live';
    if (!isPreBidWindowOpen) {
      setPreBidError('Pre-bid is allowed only when auction is upcoming or live');
      return;
    }
    if (typeof max === 'number' && val > max) {
      setPreBidError(`Must be less than or equal to ${auction?.currency} ${max}`);
      return;
    }

    try {
      const rawId = (auction as any).backendId ?? id ?? auction.id;
      const numId = Number(rawId);
      if (isNaN(numId)) {
        throw new Error('Invalid auction ID');
      }
      // Ensure user is joined before placing a bid (backend often requires membership)
      try {
        if (user?.phoneNumber) {
          await newAuctionService.joinAuction({ auction_id: numId, phone_number: user.phoneNumber });
        }
      } catch (e) {
        // Ignore join errors like "already joined"
        console.warn('[ParticipantAuctionSession] Pre-bid join attempt warning:', e);
      }

      const res = await newAuctionService.placeBid({ auction_id: numId, amount: val });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to place pre-bid');
      }

      toast.success(res.message || 'Pre-bid placed successfully');
      setShowPreBidModal(false);
      setPreBidInput('');
      setPreBidError(null);

      // Update local participants list with this pre-bid entry for immediate feedback
      const newParticipant: AuctionParticipant = {
        id: Date.now().toString(),
        auctionId: auction.id,
        userId: user.id,
        userName: user.personName,
        userPhone: user.phoneNumber,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        personName: user.personName,
        mailId: user.mailId,
        bidAmount: val,
        lastBidTime: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        status: 'approved'
      };
      setParticipants(prev => [
        newParticipant,
        ...prev.filter(p => p.userId !== user.id)
      ]);
    } catch (err: any) {
      const msg = err?.message || 'Failed to place pre-bid';
      setPreBidError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="participant-auction-loading">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>Loading auction session...</p>
        </div>

        {/* <div className="spinner-container">
  <div className="loading-spinner"></div>
  <div className="loading-text">Loading auction data...</div>
</div> */}
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="participant-auction-error">
        <div className="error-card">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2>Auction Not Found</h2>
          <p>The requested auction session could not be loaded.</p>
          <button 
            onClick={() => navigate('/dashboard/auctions')}
            className="error-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Auctions
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = formatTimeRemaining(timeLeft);
  const currentLowest = getCurrentLowest();
  const backendMeta: any = (auction as any).backend || {};
  const stats = backendMeta?.statistics || {};
  const derivedEndTime = (() => {
    try {
      const end = getAuctionEnd(auction);
      const hh = String(end.getHours()).padStart(2, '0');
      const mm = String(end.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch { return auction.auctionEndTime || ''; }
  })();

  return (
    <div className="participant-auction-session">
      {/* Header */}
      <div className="session-header">
        <button 
          onClick={() => navigate('/dashboard/auctions')}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Auctions
        </button>
        <div className="session-title-section">
          <h1 className="session-title">
            <Activity className="w-6 h-6" />
            Auction Session - {auction.auctionNo}
          </h1>
          <p className="session-subtitle">{auction.title}</p>
        </div>
        <div className={`auction-status ${auction.status === 'live' ? 'live' : auction.status === 'completed' ? 'completed' : 'upcoming'}`}>
          <Zap className="w-4 h-4" />
          {auction.status.toUpperCase()}
          {extendedCount > 0 && (
            <span className="extension-count">+{extendedCount}</span>
          )}
          {timerData && (
            <span className="timer-source" title="Using real-time API data">🔴</span>
          )}
        </div>
      </div>

      {/* Auctioneer Company Information */}
      <div className="info-card">
        <div className="card-header">
          <h2 className="card-title">
            <Building className="w-5 h-5" />
            Auctioneer Company Details
          </h2>
        </div>
        <div className="card-content">
          <div className="company-info-grid">
            <div className="company-field">
              <label>Company Name</label>
              <div className="field-value">
                {backendMeta?.user?.company_name || 
                 auction.auctioneerCompany || 
                 'Not specified'}
              </div>
            </div>
            {(backendMeta?.user?.person_name || backendMeta.auctioneerPerson) && (
              <div className="company-field">
                <label>Person Name</label>
                <div className="field-value">
                  {backendMeta?.user?.person_name || backendMeta.auctioneerPerson}
                </div>
              </div>
            )}
            {(backendMeta?.user?.email || backendMeta.auctioneerEmail) && (
              <div className="company-field">
                <label>Email</label>
                <div className="field-value">
                  {backendMeta?.user?.email || backendMeta.auctioneerEmail}
                </div>
              </div>
            )}
            <div className="company-field">
              <label>Company Address</label>
              <div className="field-value address">
                <MapPin className="w-4 h-4" />
                {backendMeta?.user?.company_address || 
                 auction.auctioneerAddress || 
                 backendMeta.auctioneerAddress || 
                 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auction Details */}
      <div className="info-card">
        <div className="card-header">
          <h2 className="card-title">
            <Info className="w-5 h-5" />
            Auction Details
          </h2>
        </div>
        <div className="card-content">
          <div className="auction-details-grid">
            <div className="detail-field">
              <label>Auction No</label>
              <div className="field-value">{auction.auctionNo}</div>
            </div>
            <div className="detail-field">
              <label>Auction Date</label>
              <div className="field-value">
                {auction.rawAuctionDate
                  ? formatDate(auction.rawAuctionDate)
                  : formatDate(auction.auctionDate)}
              </div>
            </div>
            <div className="detail-field">
              <label>Start Time</label>
              <div className="field-value">{auction.auctionStartTime}</div>
            </div>
            <div className="detail-field">
              <label>End Time</label>
              <div className="field-value">{auction.auctionEndTime || derivedEndTime || '—'}</div>
            </div>
            <div className="detail-field">
              <label>Description</label>
              <div className="field-value">{auction.auctionDetails}</div>
            </div>
            <div className="detail-field">
              <label>Currency</label>
              <div className="field-value">{auction.currency}</div>
            </div>
            <div className="detail-field">
              <label>Duration</label>
              <div className="field-value">{auction.duration} minutes</div>
            </div>
            <div className="detail-field">
              <label>Starting Price</label>
              <div className="field-value">₹{(auction.startingPrice ?? backendMeta.basePrice ?? 0) ? (Number(auction.startingPrice ?? backendMeta.basePrice).toLocaleString()) : 'N/A'}</div>
            </div>
            <div className="detail-field">
              <label>Open to All Companies</label>
              <div className="field-value">{auction.openToAllCompanies ? 'Yes' : 'No'}</div>
            </div>
            <div className="detail-field">
              <label>Pre-Bid Allowed</label>
              <div className="field-value">{auction.preBidOfferAllowed ? 'Yes' : 'No'}</div>
            </div>
            <div className="detail-field">
              <label>Decremental Value</label>
              <div className="field-value">₹{(auction.decrementalValue || 0).toLocaleString()}</div>
            </div>
            {typeof backendMeta.currentPrice === 'number' && (
              <div className="detail-field">
                <label>Current Price</label>
                <div className="field-value">₹{Number(backendMeta.currentPrice).toLocaleString()}</div>
              </div>
            )}
            {typeof backendMeta.basePrice === 'number' && (
              <div className="detail-field">
                <label>Base Price</label>
                <div className="field-value">₹{Number(backendMeta.basePrice).toLocaleString()}</div>
              </div>
            )}
            {typeof stats.total_bids === 'number' && (
              <div className="detail-field">
                <label>Total Bids</label>
                <div className="field-value">{stats.total_bids}</div>
              </div>
            )}
            {typeof stats.active_participants === 'number' && (
              <div className="detail-field">
                <label>Active Participants</label>
                <div className="field-value">{stats.active_participants}</div>
              </div>
            )}
            {typeof stats.lowest_bid !== 'undefined' && (
              <div className="detail-field">
                <label>Lowest Bid</label>
                <div className="field-value">₹{Number(stats.lowest_bid).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auction Documents */}
      {auction.documents && auction.documents.length > 0 && (
        <div className="info-card">
          <div className="card-header">
            <h2 className="card-title">
              <Info className="w-5 h-5" />
              Auction Documents
            </h2>
          </div>
          <div className="card-content">
            <div className="participants-list">
              {auction.documents.map((doc, index) => (
                <div key={index} className="participant-item">
                  <div className="participant-info">
                    <Info className="w-5 h-5" />
                    <div className="participant-details">
                      <h4>{doc.name}</h4>
                      <p>{doc.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toast.success(`Downloading ${doc.name}`);
                      console.log(`Download: ${doc.name} from ${doc.url}`);
                    }}
                    className="submit-bid-btn"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pre-Bid Participate */}
      {auction.preBidOfferAllowed && (auction.status === 'upcoming' || auction.status === 'live') && (
        <div className="info-card">
          <div className="card-header">
            <h2 className="card-title">
              <Send className="w-5 h-5" />
              Pre-Bid Participate
            </h2>
          </div>
          <div className="card-content">
            <p className="card-subtitle" style={{ marginBottom: 12 }}>
              Set your pre-bid value before auction starts. Value must be less than or equal to Decremental Value (₹{auction.decrementalValue || 0}).
            </p>
            <button className="submit-bid-btn" onClick={() => { setShowPreBidModal(true); setPreBidError(null); }}>
              <Send className="w-4 h-4" /> Add Pre-Bid
            </button>
          </div>
        </div>
      )}

      {/* Bidding Timer and Status */}
      <div className="status-grid">
    <div className="status-card timer-card">
          <div className="status-header">
            <Timer className="w-6 h-6 text-red-500" />
      <span>{auction.status === 'upcoming' ? 'Auction Starts In' : (auction.status === 'live' ? 'Auction Closes In' : 'Auction Ended')}</span>
          </div>
          <div className="timer-display">
            <div className="time-unit">
              <span className="time-value">{timeRemaining.days}</span>
              <span className="time-label">Days</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">{timeRemaining.hours.toString().padStart(2, '0')}</span>
              <span className="time-label">Hours</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">{timeRemaining.minutes.toString().padStart(2, '0')}</span>
              <span className="time-label">Min</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">{timeRemaining.seconds.toString().padStart(2, '0')}</span>
              <span className="time-label">Sec</span>
            </div>
          </div>
          {extendedCount > 0 && (
            <div className="extension-notice">
              ⚡ Extended by 3 minutes
            </div>
          )}
        </div>

        <div className="status-card">
          <div className="status-header">
            <TrendingDown className="w-6 h-6 text-green-500" />
            <span>Current Lowest (L1)</span>
          </div>
          <div className="status-value">
            ₹{currentLowest.toLocaleString()}
          </div>
          <div className="status-meta">Live status updated every second</div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <IndianRupee className="w-6 h-6 text-blue-500" />
            <span>Decremental Value</span>
          </div>
          <div className="status-value">
            ₹{(auction.decrementalValue || 0).toLocaleString()}
          </div>
          <div className="status-meta">Minimum bid reduction required</div>
        </div>
      </div>

      {/* Auto Extension Warning */}
      {timeLeft <= 3 * 60 * 1000 && auction.status === 'live' && (
        <div className="warning-card">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <div>
            <div className="warning-title">Auto-Extension Alert</div>
            <div className="warning-message">
              Auction will be extended by 3 minutes if any participant bids in the last 3 minutes
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {extensionMessage && (
        <div className="messages-card">
          <div className="card-header">
            <h3 className="card-title">Messages</h3>
          </div>
          <div className="card-content">
            <div className="message extension-message">
              <Zap className="w-4 h-4" />
              {extensionMessage}
            </div>
          </div>
        </div>
      )}

      {/* Bid Submission */}
      {auction.status === 'live' ? (
        <div className="bid-card">
          <div className="card-header">
            <h2 className="card-title">
              <Send className="w-5 h-5" />
              Submit Your Bid
            </h2>
          </div>
          <div className="card-content">
            <div className="bid-form">
              <div className="bid-input-section">
                <div className="form-group">
                  <label htmlFor="bidAmount">Your Bid Price (₹)</label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bid-input"
                    placeholder="Enter your bid amount"
                    min="1"
                    step="1"
                  />
                  <div className="input-help">
                    Must be at least ₹{auction.decrementalValue || 0} lower than current lowest
                  </div>
                </div>
                
                <div className="current-lowest">
                  <label>Current Lowest Price</label>
                  <div className="current-value">
                    ₹{currentLowest.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSubmitBid}
                disabled={isSubmittingBid || !bidAmount || auction.status !== 'live'}
                className="submit-bid-btn"
              >
                {isSubmittingBid ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Bid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="auction-ended-card">
          <div className="card-content">
            <h3>Auction {auction.status === 'completed' ? 'Completed' : 'Not Active'}</h3>
            <p>This auction has {auction.status === 'completed' ? 'ended' : 'not started yet'}. {auction.status === 'completed' ? 'No more bids can be placed.' : 'Please wait for it to start.'}</p>
          </div>
        </div>
      )}

      {/* Pre-Bid Modal */}
      {showPreBidModal && (
        <div className="participant-auction-loading" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="loading-card" style={{ width: '100%', maxWidth: 420 }}>
            <h3 style={{ marginBottom: 12 }}>Add Pre-Bid</h3>
            <input
              type="number"
              value={preBidInput}
              onChange={(e) => { setPreBidInput(e.target.value); setPreBidError(null); }}
              placeholder="Enter amount"
              min={1}
              {...(auction?.decrementalValue ? { max: auction.decrementalValue } : {})}
              className="bid-input"
            />
            {preBidError && <div style={{ color: '#dc2626', marginTop: 8 }}>{preBidError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="error-back-btn" onClick={() => setShowPreBidModal(false)}>Cancel</button>
              <button className="submit-bid-btn" onClick={handleSavePreBid}>
                <Send className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Bidding Rankings */}
      <div className="rankings-card">
        <div className="card-header">
          <h2 className="card-title">
            <Crown className="w-5 h-5" />
            Live Bidding Rankings (Lowest to Show)
          </h2>
          <p className="card-subtitle">Real-time bid updates • Total Participants: {participants.length}</p>
        </div>
        <div className="card-content">
          <div className="rankings-list">
            {participants.length > 0 ? (
              participants
                .sort((a, b) => a.bidAmount - b.bidAmount) // Sort by lowest to highest
                .slice(0, 10) // Show only top 10
                .map((participant, index) => (
                <div 
                  key={participant.id} 
                  className={`ranking-item ${participant.userId === user?.id ? 'current-user' : ''} ${index === 0 ? 'winner' : ''}`}
                >
                  <div className="ranking-left">
                    <div className="rank-section">
                      {getRankIcon(index + 1)}
                      <span className="rank-text">L{index + 1}</span>
                    </div>
                    
                    <div className="participant-info">
                      <div className="company-name">
                        <Building className="w-4 h-4" />
                        {participant.companyName}
                        {participant.userId === user?.id && (
                          <span className="user-badge">You</span>
                        )}
                      </div>
                      <div className="company-address">
                        <MapPin className="w-3 h-3" />
                        {participant.companyAddress}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ranking-right">
                    <div className={`offered-price ${index === 0 ? 'lowest' : ''}`}>
                      ₹{participant.bidAmount.toLocaleString()}
                    </div>
                    <div className="bid-time">
                      <Clock className="w-3 h-3" />
                      {format(new Date(participant.lastBidTime), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-participants">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h4>No Bids Placed Yet</h4>
                <p>Be the first to place a bid in this auction!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantAuctionSession;

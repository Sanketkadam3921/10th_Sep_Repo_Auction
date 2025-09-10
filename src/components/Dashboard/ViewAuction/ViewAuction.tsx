import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ViewAuction.css";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  Building,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  IndianRupee,
  Timer,
  ArrowLeft,
  Play,
  Gavel,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import AuctionService from "../../../services/auctionService";
import apiAuctionService from "../../../services/apiAuctionService";
import newAuctionService from "../../../services/newAuctionService";
import { BaseAuction, AuctionParticipant } from "../../../types/auction";


const ViewAuction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [auctioneer, setAuctioneer] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null); // Store user details from token
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // New states for Pre-Build modal
  const [showPreBuildModal, setShowPreBuildModal] = useState(false);
  const [preBuildInput, setPreBuildInput] = useState('');
  const [preBuildError, setPreBuildError] = useState<string | null>(null);

  useEffect(() => {
    loadAuctionDetails();
    fetchUserDetails(); // Fetch user details when component loads
    
    // Set up status monitoring for live duration updates
    const statusMonitor = setInterval(() => {
      if (auction && auction.status === 'upcoming') {
        const now = new Date();
        const startTime = new Date(`${auction.auctionDate}T${auction.auctionStartTime}:00`);
        
        if (now >= startTime) {
          console.log('[ViewAuction] Auction start time reached, refreshing for live status');
          loadAuctionDetails(); // Refresh to get live duration from backend
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(statusMonitor);
  }, [id, auction?.status]);

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
          console.log('[ViewAuction] User details fetched:', result.user);
        }
      }
    } catch (error) {
      console.error('[ViewAuction] Failed to fetch user details:', error);
    }
  };

  const loadAuctionDetails = async () => {
    if (!id) {
      navigate("/dashboard/auctions");
      return;
    }
    setLoading(true);
    try {
      let auctionData: BaseAuction | null = null;
      
      // Try new auction details API first
      try {
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
              auctioneer: result.auctioneer || result.user, // Store auctioneer info
              creator_info: result.user
            };
            
            // Store auctioneer company details from the auction data
            auctionData.auctioneerCompany = rawAuction.auctioneer_company_name || rawAuction.company_name;
            auctionData.auctioneerPhone = rawAuction.auctioneer_phone || rawAuction.phone_number;
            auctionData.auctioneerAddress = rawAuction.auctioneer_address || rawAuction.company_address;
            (auctionData as any).auctioneerEmail = rawAuction.auctioneer_email || rawAuction.email;
            (auctionData as any).auctioneerPerson = result.user?.person_name || rawAuction.person_name;
            
            // Set user details for auctioneer info display
            if (result.user) {
              setUserDetails({
                company_name: rawAuction.auctioneer_company_name || result.user.company_name,
                person_name: result.user.person_name,
                email: rawAuction.auctioneer_email || result.user.email,
                phone_number: rawAuction.auctioneer_phone || result.user.phone_number,
                company_address: rawAuction.auctioneer_address || result.user.company_address
              });
            }
            
            console.log('[ViewAuction] New API fetch successful:', auctionData);
          }
        } else if (response.status === 403) {
          // 403 is expected for participants who don't have direct access - silently continue to fallback
          console.log('[ViewAuction] Direct API returned 403 (expected for participants), using fallback');
        }
      } catch (newApiErr: any) {
        // Only log non-403 errors to avoid console spam
        if (!newApiErr?.message?.includes('403') && !newApiErr?.message?.includes('Forbidden')) {
          console.warn('[ViewAuction] New auction details API failed, trying legacy:', newApiErr);
        } else {
          console.log('[ViewAuction] Direct API access denied (expected for participants), using fallback');
        }
      }
      
      // Fallback to legacy API if new API failed
      if (!auctionData) {
        try {
          auctionData = await apiAuctionService.fetchAuctionById(id);
          console.log('[ViewAuction] Legacy API fetch successful:', auctionData);
        } catch (apiErr: any) {
          // Only log non-403 errors to avoid console spam for expected permission issues
          if (!apiErr?.message?.includes('403') && !apiErr?.message?.includes('Forbidden')) {
            console.warn('Legacy API fetch failed, falling back to local storage:', apiErr);
          } else {
            console.log('[ViewAuction] API access denied, trying local storage fallback');
          }
          auctionData = AuctionService.getAuctionById(id);
        }
      }
      
      if (!auctionData) {
        toast.error("Auction not found");
        navigate("/dashboard/auctions");
        return;
      }
      
      setAuction(auctionData);
      const participantData = AuctionService.getParticipantsByAuction(id);
      setParticipants(participantData);
      const auctioneerData = AuctionService.getUserById(auctionData.createdBy);
      setAuctioneer(auctioneerData);
    } catch (error) {
      console.error("Error loading auction details:", error);
      toast.error("Failed to load auction details");
      navigate("/dashboard/auctions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (doc: { name: string; url: string }) => {
    toast.success(`Downloading ${doc.name}`);
    console.log(`Download: ${doc.name} from ${doc.url}`);
  };

  const handleJoinAuction = async () => {
    if (!auction || !user) return;
    try {
      // Try backend join first (new API). Fallback to local join.
      const backendId = (auction as any).backendId || auction.id;
      const numId = Number(backendId);
      let didJoinBackend = false;
      if (!isNaN(numId) && user.phoneNumber) {
        try {
          const res = await newAuctionService.joinAuction({
            auction_id: numId,
            phone_number: user.phoneNumber,
          });
          console.log('[ViewAuction] joinAuction (new API) result:', res);
          didJoinBackend = !!res?.success;
        } catch (err) {
          console.warn('[ViewAuction] joinAuction (new API) failed, will fallback', err);
        }
      }
      if (!didJoinBackend) {
        const participantData = {
          auctionId: auction.id,
          phoneNumber: user.phoneNumber,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          personName: user.personName,
          mailId: user.mailId,
        };
        AuctionService.joinAuction(participantData, user.id);
      }
      toast.success("Successfully joined the auction!");
      loadAuctionDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to join auction");
    }
  };
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
  // --- Pre-Build modal logic
  // Updated: Pre-Build must NOT be greater than Decremental Value
  const handleSavePreBuild = async () => {
    if (!auction) return;
    const val = Number(preBuildInput);
    const max = auction?.decrementalValue;
    if (isNaN(val) || val <= 0) {
      setPreBuildError('Enter a valid number');
      return;
    }
    
    // Allow pre-bid when auction is upcoming or live
    const isPreBidWindowOpen = auction.status === 'upcoming' || auction.status === 'live';
    if (!isPreBidWindowOpen) {
      setPreBuildError('Pre-bid is allowed only when auction is upcoming or live');
      return;
    }
    
    if (typeof max === 'number' && val > max) {
      setPreBuildError(`Must be less than or equal to ${auction?.currency} ${max}`);
      return;
    }

    try {
      const rawId = (auction as any).backendId ?? (auction as any).backend?.id ?? auction.id;
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
        console.warn('[ViewAuction] Pre-bid join attempt warning:', e);
      }
      
      const res = await newAuctionService.placeBid({ auction_id: numId, amount: val });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to place pre-bid');
      }
      
      toast.success(res.message || 'Pre-bid placed successfully');
      setShowPreBuildModal(false);
      setPreBuildInput('');
      // Refresh auction details to reflect new current price and bids
      await loadAuctionDetails();
    } catch (err: any) {
      const msg = err?.message || 'Failed to place pre-bid';
      setPreBuildError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="view-auction-container">
        <div className="auction-details-card">
          <div className="loading-spinner">
            <p>Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="view-auction-container">
        <div className="auction-details-card">
          <div className="error-message">
            <XCircle className="w-5 h-5" />
            <div>
              <h3>Auction Not Found</h3>
              <p>The requested auction could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper: backend meta if present
  const backendMeta: any = (auction as any).backend;
  const backendParticipants = backendMeta?.participantsList || [];
  const bidHistory = backendMeta?.bidHistory || [];

  return (
    <div className="view-auction-container">
      {/* Header */}
      <div className="view-auction-header">
        <div>
          <h1 className="auction-title">View Auction: {auction.auctionNo}</h1>
          <p className="auction-subtitle">
            Complete auction details and participant information
          </p>
        </div>
        <span className={`auction-status-badge status-${auction.status}`}>
          {auction.status.toUpperCase()}
        </span>
      </div>

      {/* Auctioneer Company Details */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Building className="w-5 h-5" />
          Auctioneer Company Details
        </h2>
        <div className="auction-info-grid">
          <div>
            <label className="info-label">Company Name</label>
            <div className="info-value">
              {userDetails?.company_name || 
               backendMeta?.user?.company_name || 
               backendMeta?.creator_info?.company_name || 
               auctioneer?.companyName || 
               auction.auctioneerCompany || 
               "Unknown Company"}
            </div>
          </div>
          <div>
            <label className="info-label">Person Name</label>
            <div className="info-value">
              {userDetails?.person_name || 
               backendMeta?.user?.person_name || 
               backendMeta?.creator_info?.person_name || 
               auctioneer?.personName || 
               backendMeta?.auctioneerPerson || 
               "Unknown Person"}
            </div>
          </div>
          <div>
            <label className="info-label">Email Address</label>
            <div className="info-value">
              {userDetails?.email || 
               backendMeta?.user?.email || 
               backendMeta?.creator_info?.email || 
               auctioneer?.email || 
               auctioneer?.mailId || 
               backendMeta?.auctioneerEmail || 
               "Unknown Email"}
            </div>
          </div>
          <div>
            <label className="info-label">Company Address</label>
            <div className="info-value">
              {userDetails?.company_address || 
               backendMeta?.user?.company_address || 
               backendMeta?.creator_info?.company_address || 
               auctioneer?.companyAddress || 
               backendMeta?.auctioneerAddress || 
               "Unknown Address"}
            </div>
          </div>
        </div>
      </div>

      {/* Auction Information */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Calendar className="w-5 h-5" />
          Auction Information
        </h2>
        <div className="auction-info-grid">
          <div className="info-item">
            <label className="info-label">Auction Date</label>
            <div className="info-value">
              {auction.rawAuctionDate
                ? formatDate(auction.rawAuctionDate)
                : formatDate(auction.auctionDate)}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Start Time</label>
            <div className="info-value">
              {auction.auctionStartTime}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">End Time</label>
            <div className="info-value">
              {auction.auctionEndTime || '—'}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Duration</label>
            <div className="info-value">
              {auction.duration} minutes
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Currency</label>
            <div className="info-value price">
              {auction.currency === 'INR' ? 'INR' : auction.currency}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Open to All Companies</label>
            <div className="info-value">
              {auction.openToAllCompanies ? (
                <>
                  <span>Yes</span>
                </>
              ) : (
                <>
                  <span>No</span>
                </>
              )}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Pre-Bid Offer Allowed</label>
            <div className="info-value">
              {auction.preBidOfferAllowed ? (
                <>
                  <span>Yes</span>
                </>
              ) : (
                <>
                  <span>No</span>
                </>
              )}
            </div>
          </div>
          {backendMeta?.basePrice !== undefined && (
            <div className="info-item">
              <label className="info-label">Base Price</label>
              <div className="info-value price">
                {auction.currency} {backendMeta.basePrice.toLocaleString()}
              </div>
            </div>
          )}
          {backendMeta?.currentPrice !== undefined && (
            <div className="info-item">
              <label className="info-label">Current Price</label>
              <div className="info-value price">
                {auction.currency} {backendMeta.currentPrice.toLocaleString()}
              </div>
            </div>
          )}
          {backendMeta?.statistics && (
            <>
              <div className="info-item">
                <label className="info-label">Total Bids</label>
                <div className="info-value">
                  {backendMeta.statistics.total_bids || 0}
                </div>
              </div>
              <div className="info-item">
                <label className="info-label">Active Participants</label>
                <div className="info-value">
                  {backendMeta.statistics.active_participants || 0}
                </div>
              </div>
              {backendMeta.statistics.lowest_bid && (
                <div className="info-item">
                  <label className="info-label">Lowest Bid</label>
                  <div className="info-value price">
                    {auction.currency} {Number(backendMeta.statistics.lowest_bid).toLocaleString()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {auction.decrementalValue && (
          <div className="auction-description">
            <h4>Decremental Value</h4>
            <p>
              {auction.currency} {auction.decrementalValue.toLocaleString()}
              <span> (Minimum bid reduction amount)</span>
            </p>
          </div>
        )}
      </div>

      {/* Auction Details/Description */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <FileText className="w-5 h-5" />
          Auction Details / Description
        </h2>
        <div className="auction-description">
          <p>{auction.auctionDetails}</p>
        </div>
      </div>

      {/* Pre-Bid Participate Section */}
      <div className="auction-details-card prebuild-section">
        <h2 className="card-title">
          <Gavel className="w-5 h-5" />
          Pre-Bid Participate
        </h2>
        <div className="prebuild-content" style={{ marginTop: "15px" }}>
          <p className="prebuild-info " style={{ marginBottom: "15px" }}>
            Set your Pre-Bid value before auction starts. Value must be less than or equal to Decremental Value ({auction.currency} {auction.decrementalValue || 0}).
          </p>
          <button
            className="btn btn-primary prebid-btn"
            onClick={() => setShowPreBuildModal(true)}
          >
            Add Pre-Bid
          </button>
        </div>
      </div>

      {/* Pre-Build Modal */}
      {showPreBuildModal && (
        <div className="prebuild-modal-overlay" role="dialog" aria-modal="true">
          <div className="prebuild-modal">
            <h3 className="prebuild-modal-title">Add Pre-Build</h3>

            <input
              type="number"
              className="prebuild-input"
              placeholder="Enter amount"
              value={preBuildInput}
              onChange={(e) => {
                setPreBuildInput(e.target.value);
                setPreBuildError(null);
              }}
              min={1}
              {...(auction?.decrementalValue ? { max: auction.decrementalValue } : {})}
            />
            {preBuildError && (
              <div className="prebuild-error">{preBuildError}</div>
            )}
            <div className="prebuild-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPreBuildModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSavePreBuild}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Documents */}
      {auction.documents.length > 0 && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <FileText className="w-5 h-5" />
            Auction Documents
          </h2>
          <div className="participants-list">
            {auction.documents.map((doc, index) => (
              <div key={index} className="participant-item">
                <div className="participant-info">
                  <FileText className="w-5 h-5" />
                  <div className="participant-details">
                    <h4>{doc.name}</h4>
                    <p>{doc.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="btn btn-secondary"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of Participants */}
      <div className="participants-section">
        <div className="participants-header">
          <h2 className="card-title">
            <Users className="w-5 h-5" />
            Participants
            <span className="participants-count">
              ({backendParticipants.length || auction.participants.length})
            </span>
          </h2>
        </div>
        {backendParticipants.length > 0 ? (
          <div className="participants-list">
            {backendParticipants.map((p: any, index: number) => (
              <div key={index} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {(p.person_name || p.phone_number || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-details">
                    <h4>{p.person_name || 'N/A'}</h4>
                    <p>{p.company_name || p.phone_number}</p>
                  </div>
                </div>
                <div className={`participant-status status-${p.status || 'invited'}`}>{p.status}</div>
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="join-form">
            <Users className="w-12 h-12" />
            <h3>No Participants Yet</h3>
            <p>No participants registered for this auction yet</p>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {participant.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-details">
                    <h4>{participant.personName}</h4>
                    <p>{participant.companyName}</p>
                  </div>
                </div>
                <div className="participant-status status-active">Active</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid History (Backend) */}
      {bidHistory.length > 0 && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <Clock className="w-5 h-5" />
            Bid History
          </h2>
          <div className="participants-list">
            {bidHistory.slice().sort((a: any, b: any) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime()).map((b: any) => (
              <div key={b.id} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">{(b.person_name || 'B').charAt(0)}</div>
                  <div className="participant-details">
                    <h4>{b.company_name || b.person_name || 'Bidder'}</h4>
                    <p>{new Date(b.bid_time).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`participant-status ${b.is_winning ? 'status-active' : ''}`}>{b.amount}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="auction-details-card">
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 md:p-6">
          <button
            onClick={() => navigate("/dashboard/auctions")}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Auctions
          </button>
          {auction.status === "upcoming" &&
            user?.role === "participant" &&
            !participants.some((p) => p.userId === user.id) && (
              <button onClick={handleJoinAuction} className="btn btn-primary">
                <Users className="w-4 h-4" />
                Join Auction
              </button>
            )}
          {auction.status === "live" && (
            <button
              onClick={() => {
                toast.success("Redirecting to live auction...");
                navigate(`/dashboard/join/${auction.id}`);
              }}
              className="btn btn-primary"
            >
              <Play className="w-4 h-4" />
              Join Live Auction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAuction;

import React, { useState, useEffect } from 'react';
import './AuctionReports.css';
import ReportService, { AuctionReport, AuctionBidSummary } from '../../../services/reportService';
import { format } from 'date-fns';

interface BaseAuction {
  id: string;
  auctionNo: string;
  title: string;
  auctionDetails: string;
  auctionDate: string;
  auctionStartTime: string;
  duration?: number;
  openToAllCompanies: boolean;
  currency: string;
  decrementalValue?: string;
}

interface AuctionParticipant {
  id: string;
  userId: string;
  companyName: string;
  preBidOffer?: number;
  finalBid?: number;
  rank?: string;
}

const AuctionReports: React.FC = () => {
  const [auctions, setAuctions] = useState<BaseAuction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  const safeDateParse = (dateString: string): string => {
    try {
      if (!dateString) return new Date().toISOString().split('T')[0];
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const transformAuctionData = (report: AuctionReport): BaseAuction => ({
    id: report.id.toString(),
    auctionNo: `AUC-${report.id.toString().padStart(3, '0')}`,
    title: report.title,
    auctionDetails: report.auction_details || report.description,
    auctionDate: safeDateParse(report.auctionDate || report.auction_date),
    auctionStartTime: report.auctionStartTime || report.start_time || '10:00:00',
    duration: 60,
    openToAllCompanies: true,
    currency: report.currency || 'INR',
    decrementalValue: report.decremental_value
  });

  const transformParticipantsData = (bids: AuctionBidSummary[]): AuctionParticipant[] =>
    bids.map((bid, index) => ({
      id: `participant-${index}`,
      userId: `user-${index}`,
      companyName: bid.company_name,
      preBidOffer: parseFloat(bid.pre_bid_offer),
      finalBid: parseFloat(bid.final_bid_offer),
      rank: `L${bid.bid_rank}`
    }));

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        const auctionList = await ReportService.getAllAuctions();
        const transformedAuctions: BaseAuction[] = auctionList.map(auction => ({
          id: auction.id.toString(),
          auctionNo: `AUC-${auction.id.toString().padStart(3, '0')}`,
          title: auction.title,
          auctionDetails: auction.title,
          auctionDate: new Date().toISOString().split('T')[0],
          auctionStartTime: '10:00',
          duration: 60,
          openToAllCompanies: true,
          currency: 'INR',
          decrementalValue: undefined
        }));
        setAuctions(transformedAuctions);
        if (transformedAuctions.length > 0) setSelectedAuction(transformedAuctions[0]);
      } catch (err) {
        console.error('Error loading auctions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAuctions();
  }, []);

  useEffect(() => {
    const loadAuctionDetails = async () => {
      if (!selectedAuction) return;
      try {
        setLoading(true);
        const report = await ReportService.getAuctionReport(parseInt(selectedAuction.id));
        setSelectedAuction(transformAuctionData(report));
        setParticipants(transformParticipantsData(report.bids));
      } catch (err) {
        console.error('Error loading auction details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedAuction) loadAuctionDetails();
  }, [selectedAuction?.id]);

  const getEndTime = (auction: BaseAuction) => {
    try {
      const startTime = auction.auctionStartTime.substring(0, 5);
      const startIso = `${auction.auctionDate}T${startTime}:00`;
      const start = new Date(startIso);
      if (isNaN(start.getTime())) return new Date();
      return new Date(start.getTime() + (auction.duration || 60) * 60000);
    } catch {
      return new Date();
    }
  };

  // Updated date formatting function for consistency across modules
  const formatDateConsistent = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';

      // Use DD-MM-YYYY format for consistency with other modules
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTimeConsistent = (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Time';

      // Use HH:MM format
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'Invalid Time';
    }
  };

  const safeFormat = (date: Date | string, formatStr: string): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, formatStr);
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !selectedAuction) {
    return (
      <div className="ap-reports-wrapper">
        <div className="ap-reports-header">
          <div className="ap-reports-header-content">
            <div className="ap-reports-title-section">
              <h1 className="ap-reports-title">Auction Reports</h1>
              <p className="ap-reports-subtitle">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-reports-wrapper">
      <div className="ap-reports-header">
        <div className="ap-reports-header-content">
          <div className="ap-reports-title-section">
            <h1 className="ap-reports-title">Auction Reports</h1>
            <p className="ap-reports-subtitle">Detailed report for each auction</p>
          </div>
          <div className="ap-reports-actions">
            <select
              className="ap-reports-filter-select"
              value={selectedAuction?.id || ''}
              onChange={e => {
                const found = auctions.find(a => a.id === e.target.value);
                setSelectedAuction(found || null);
              }}
              disabled={loading}
            >
              {auctions.map(a => (
                <option key={a.id} value={a.id}>
                  {a.auctionNo} - {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedAuction && (
        <div className="ap-reports-overview">
          {/* Auction Details - Improved formatting */}
          <div className="ap-reports-overview-card">
            <div className="ap-reports-overview-header">
              <h2 className="ap-reports-overview-title">Auction Details</h2>
            </div>
            <div className="ap-reports-details-grid">
              <div>
                <strong>Auction No.</strong>
                <span>{selectedAuction.auctionNo}</span>
              </div>
              <div>
                <strong>Auction Details</strong>
                <span>{selectedAuction.auctionDetails}</span>
              </div>
              <div>
                <strong>Auction Date</strong>
                <span>{formatDateConsistent(new Date(selectedAuction.auctionDate))}</span>
              </div>
              <div>
                <strong>Start Time</strong>
                <span>{formatTimeConsistent(`${selectedAuction.auctionDate}T${selectedAuction.auctionStartTime}`)}</span>
              </div>
              <div>
                <strong>End Time</strong>
                <span>{formatTimeConsistent(getEndTime(selectedAuction))}</span>
              </div>
              <div>
                <strong>Open to All</strong>
                <span>{selectedAuction.openToAllCompanies ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <strong>Currency</strong>
                <span>{selectedAuction.currency}</span>
              </div>
              <div>
                <strong>Decremental Value</strong>
                <span>
                  {selectedAuction.decrementalValue
                    ? `${selectedAuction.currency} ${selectedAuction.decrementalValue}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Bid Summary - Enhanced mobile visibility */}
          <div className="ap-reports-overview-card">
            <div className="ap-reports-overview-header">
              <h2 className="ap-reports-overview-title">Bid Summary</h2>
            </div>
            <div className="ap-reports-bid-table-wrapper">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                  Loading bid details...
                </div>
              ) : participants.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                  No bid data available
                </div>
              ) : (
                <table className="ap-reports-bid-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Participant Company Name</th>
                      <th>Pre Bid Offer</th>
                      <th>Final Bid Offer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id} className={p.rank === 'L1' ? 'ap-row-l1' : ''}>
                        <td data-label="Rank">
                          <span className="rank-badge">{p.rank}</span>
                        </td>
                        <td data-label="Company">{p.companyName}</td>
                        <td data-label="Pre Bid">
                          {p.preBidOffer ? `${selectedAuction.currency} ${p.preBidOffer.toLocaleString()}` : 'N/A'}
                        </td>
                        <td data-label="Final Bid">
                          {p.finalBid != null ? `${selectedAuction.currency} ${p.finalBid.toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionReports;
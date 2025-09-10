import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Check, X, Gavel, Calendar, Clock, Users, Building, MapPin, FileText, Download, AlertTriangle, Trash2, RefreshCcw } from 'lucide-react';
import adminAuctionService, { NormalizedAuctionRecord, NormalizedAuctionParticipant } from '../../../services/adminAuctionService';

import './ManageAuction.css';

type Auction = NormalizedAuctionRecord;

const ManageAuctions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'upcoming' | 'live' | 'completed' | 'cancelled' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'electronics' | 'machinery' | 'vehicles' | 'furniture' | 'other'>('all');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [recentlyRejected, setRecentlyRejected] = useState<Auction | null>(null);

  const statusMapForFilter = (status: string) => {
    // Map legacy UI statuses to backend recognized statuses if necessary
    const map: Record<string, string> = {
      active: 'live',
      approved: 'live',
      pending: 'pending',
    };
    return map[status] || status;
  };

  const fetchAuctions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list = await adminAuctionService.listAuctions({
        page,
        limit,
        status: filterStatus === 'all' ? '' : statusMapForFilter(filterStatus),
        search: searchTerm.trim(),
      });
      setAuctions(list.auctions);
      setTotal(list.total);
      // If viewing rejected filter and backend returned none but we have a locally rejected auction, append it
      if (filterStatus === 'rejected' && list.auctions.length === 0 && recentlyRejected) {
        setAuctions([recentlyRejected]);
        setTotal(1);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load auctions');
    } finally { setLoading(false); }
  }, [page, limit, filterStatus, searchTerm, recentlyRejected]);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions, refreshIndex]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Export functionality
  const handleExportAuctions = () => {
    if (!auctions.length) {
      alert("No auctions to export");
      return;
    }

    // Convert auctions to CSV
    const headers = [
      "Title",
      "Description",
      "Auctioneer Name",
      "Auctioneer Phone",
      "Company Name",
      "Base Price (INR)",
      "Current Bid (INR)",
      "Decremental Value (INR)",
      "Status",
      "Category",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Location",
      "Auto Extension",
      "Extension Time (min)",
      "Total Participants",
      "Approved Participants",
      "Pending Participants",
      "Rejected Participants",
      "Created At"
    ];

    const rows = auctions.map(auction => [
      auction.title,
      auction.description.replace(/,/g, ';'), // Replace commas to avoid CSV parsing issues
      auction.auctioneerName,
      auction.auctioneer_phone,
      auction.companyName,
      auction.basePrice,
      auction.currentBid > 0 ? auction.currentBid : 0,
      auction.decrementalValue,
      auction.status,
      auction.category,
      auction.startDate,
      auction.startTime,
      auction.endDate,
      auction.endTime,
      auction.location ? auction.location.replace(/,/g, ';') : '',
      auction.autoExtension ? 'Yes' : 'No',
      auction.extensionTime || '',
      auction.participants.length,
      auction.participants.filter(p => p.status === 'approved').length,
      auction.participants.filter(p => p.status === 'pending').length,
      auction.participants.filter(p => p.status === 'rejected').length,
      new Date(auction.createdAt).toLocaleString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a data URL from the blob
    // This approach is more reliable on mobile devices
    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    // Assign the data URL to the window's location to trigger a download
    // This is more likely to work on mobile browsers
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `auctions_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after the download is initiated
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = async (auction: Auction) => {
    setDetailLoading(true);
    try {
      const full = await adminAuctionService.getAuctionById(auction.id);
      setSelectedAuction(full);
    } catch (e) {
      // fallback to list auction
      setSelectedAuction(auction);
    } finally { setDetailLoading(false); }
  };

  const handleApproveAuction = async (auctionId: string) => {
    try {
      setActionMessage(null);
      await adminAuctionService.updateAuctionStatus(auctionId, 'live');
      setActionMessage('Auction approved');
      setRefreshIndex(i => i + 1);
    } catch (e: any) { setActionMessage(e.message || 'Failed to approve'); }
  };

  const handleRejectAuction = async (auctionId: string, reason: string) => {
    try {
      setActionMessage(null);
      await adminAuctionService.updateAuctionStatus(auctionId, 'rejected', reason);
      setActionMessage('Auction rejected');
      setRefreshIndex(i => i + 1);
    } catch (e: any) { setActionMessage(e.message || 'Failed to reject'); }
  };

  // Unified reject action (also used to "close" auction) sets status to 'rejected'
  const handleCloseAuction = async (auctionId: string) => {
    if (!window.confirm('Reject this auction? Users will see it was rejected by Admin.')) return;
    try {
      setActionMessage(null);
      const updated = await adminAuctionService.updateAuctionStatus(auctionId, 'rejected', 'Admin rejected');
      setActionMessage('Auction rejected by Admin');
      // Optimistic: update local list
      setAuctions(prev => {
        const exists = prev.some(a => a.id === updated.id);
        const next = exists ? prev.map(a => a.id === updated.id ? updated : a) : [...prev, updated];
        return next;
      });
      setRecentlyRejected(updated);
      // Only refetch if not currently filtering rejected (avoid losing optimistic item)
      if (filterStatus !== 'rejected') {
        setRefreshIndex(i => i + 1);
      } else {
        // Force filter recalculation by touching page state (no actual refetch)
        setTotal(t => (auctions.length ? t : 1));
      }
    } catch (e: any) {
      setActionMessage(e.message || 'Failed to reject auction');
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!window.confirm('Delete this auction?')) return;
    try { setActionMessage(null); await adminAuctionService.deleteAuction(auctionId); setActionMessage('Auction deleted'); setRefreshIndex(i => i + 1); } catch (e: any) { setActionMessage(e.message || 'Delete failed'); }
  };

  const handleUpdateParticipantStatus = async (auctionId: string, participantId: string, status: string) => {
    try {
      setActionMessage(null);
      const updated = await adminAuctionService.updateParticipantStatus(auctionId, participantId, status);
      setSelectedAuction(updated); // refresh modal view
      setActionMessage('Participant status updated');
    } catch (e: any) { setActionMessage(e.message || 'Failed to update participant'); }
  };

  // Filter auctions
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.auctioneerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || auction.status === filterStatus || statusMapForFilter(filterStatus) === auction.status;
    const matchesCategory = filterCategory === 'all' || auction.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="manage-auctions">
      {/* Header */}
      <div className="manage-auctions-header">
        <h1>Manage Auctions</h1>
        <div className="manage-auctions-actions">
          <button className="btn btn-primary" onClick={handleExportAuctions}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="manage-auctions-filters">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search auctions"             // placeholder="Search auctions by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>

          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        {/* <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as any)}
          className="input"
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="machinery">Machinery</option>
          <option value="vehicles">Vehicles</option>
          <option value="furniture">Furniture</option>
          <option value="other">Other</option>
        </select>*/}
      </div>

      {/* Auctions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold items-center">
            <Gavel className="w-5 h-5 mr-2" />
            Auctions
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => setRefreshIndex(i => i + 1)} title="Refresh" disabled={loading}>
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="auctions-table-container">
            {actionMessage && (
              <div style={{ padding: '0.5rem 1rem', background: '#eef2ff', color: '#3730a3', fontSize: 14 }}>{actionMessage}</div>
            )}
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b' }}>{error}</div>
            )}
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading auctions...</div>
            ) : (
              <table className="auctions-table responsive-table">
                <thead>
                  <tr>
                    <th>Auction Details</th>
                    <th>Auctioneer</th>
                    <th>Pricing & Status</th>
                    <th>Schedule</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuctions.map((auction) => (
                    <tr key={auction.id}>
                      <td data-label="Auction Details">
                        <div>
                          <div className="font-medium">{auction.title}</div>
                          <div className="text-sm mt-1">{auction.description.substring(0, 15)}</div>
                          <div className="text-sm flex items-center mt-1">
                          </div>

                        </div>
                      </td>
                      <td data-label="Auctioneer">
                        <div>
                          <div className="font-medium">{auction.auctioneerName}</div>

                          <div className="text-sm">{auction.auctioneer_phone}</div>
                        </div>
                      </td>
                      <td data-label="Pricing & Status">
                        <div>

                          {auction.currentBid > 0 && (
                            <div className="text-sm font-medium">
                              Current: {formatCurrency(auction.currentBid)}
                            </div>
                          )}
                          <span className={`auction-status ${auction.status}`}>
                            {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                          </span>
                          <div className="text-xs mt-1">
                            Decrement: ₹{auction.decrementalValue.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td data-label="Schedule">
                        <div>
                          <div className="mt-2 mr-2 items-center">
                            {auction.startDate}
                          </div>
                          <div className=" items-center">
                            {auction.startTime} - {auction.endTime || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td data-label="Participants">
                        <div className=" items-center">
                          <span>Total Participants: {auction.total_participants}</span>
                        </div>
                        <div className="text-xs mt-1">
                          Approved: {auction.joined_participants}
                        </div>
                        <div className="text-xs">
                          Pending: {auction.invited_participants}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="auction-actions">
                          <button
                            onClick={() => handleViewDetails(auction)}
                            className="auction-btn view"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {auction.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveAuction(auction.id)}
                                className="auction-btn approve"
                                title="Approve Auction"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectAuction(auction.id, "Admin rejected")}
                                className="auction-btn reject"
                                title="Reject Auction"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteAuction(auction.id)}
                            className="auction-btn reject"
                            title="Delete Auction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredAuctions.length && !loading && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>No auctions found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {/* Pagination */}
      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14 }}>
          Page {page} • Showing{" "}
          {auctions.length ? (page - 1) * limit + 1 : 0}-
          {(page - 1) * limit + auctions.length}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline"
            >
              Prev
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        </div>
      </div>


      {/* Auction Details Modal */}
      {selectedAuction && (
        <div className="auction-modal-overlay">
          <div className="auction-modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Auction Details</h2>
              <button
                onClick={() => setSelectedAuction(null)}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="auction-modal-content-wrapper">
              <div className="modal-content">
                {detailLoading && <div style={{ padding: '0.5rem', fontSize: 14 }}>Loading details...</div>}
                {/* Basic Information */}
                <div className="modal-section">
                  <h3>Basic Information</h3>
                  <div className="modal-row">
                    <span className="modal-label">Title:</span>
                    <span className="modal-value">{selectedAuction.title}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">Description:</span>
                    <span className="modal-value">{selectedAuction.description}</span>
                  </div>


                  <div className="modal-row">
                    <span className="modal-label">Current Bid:</span>
                    <span className="modal-value">{selectedAuction.currentBid > 0 ? formatCurrency(selectedAuction.currentBid) : 'No bids yet'}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">Decremental:</span>
                    <span className="modal-value">₹{selectedAuction.decrementalValue.toLocaleString()}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">Status:</span>
                    <span className="modal-value">
                      <span className={`auction-status ${selectedAuction.status}`}>
                        {selectedAuction.status}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Company & Auctioneer Information */}
                <div className="modal-section">
                  <h3>Company & Auctioneer</h3>
                  <div className="modal-row">
                    <span className="modal-label">Company:</span>
                    <span className="modal-value">{selectedAuction.companyName}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">Auctioneer:</span>
                    <span className="modal-value">{selectedAuction.auctioneerName}</span>
                  </div>
                  {/**    <div className="modal-row">
                    <span className="modal-label">Phone:</span>
                    <span className="modal-value">{selectedAuction.auctioneer_phone}</span>
                  </div>*/}
                </div>

                {/* Schedule Information */}
                <div className="modal-section">
                  <h3>Schedule</h3>
                  <div className="modal-row">
                    <span className="modal-label">Start:</span>
                    <span className="modal-value">{selectedAuction.startDate} at {selectedAuction.startTime}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">End:</span>
                    <span className="modal-value">{selectedAuction.endDate || 'N/A'} at {selectedAuction.endTime || 'N/A'}</span>
                  </div>
                  <div className="modal-row">
                    <span className="modal-label">Auto Extension:</span>
                    <span className="modal-value">{selectedAuction.autoExtension ? 'Yes' : 'No'}</span>
                  </div>

                </div>

                {/* Location Information 
                <div className="modal-section">
                  <h3>Location</h3>
                  <div className="modal-row">
                    <span className="modal-label">Address:</span>
                    <span className="modal-value">{selectedAuction.location || 'N/A'}</span>
                  </div>


                </div>*/}

                {/* Participants */}
                <div className="modal-section" style={{ gridColumn: '1 / -1' }}>
                  <h3>Participants ({selectedAuction.participants.length})</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="participants-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Company</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.participants.map((participant) => (
                          <tr key={participant.id}>
                            <td>{participant.name}</td>
                            <td>{participant.company}</td>
                            <td>{participant.phone || 'N/A'}</td>
                            <td>
                              <span className={`auction-status ${participant.status}`}>
                                {participant.status}
                              </span>
                            </td>
                            <td style={{ display: 'flex', gap: 4 }}>
                              {participant.status !== 'approved' && (
                                <button
                                  onClick={() => handleUpdateParticipantStatus(selectedAuction.id, participant.id, 'approved')}
                                  className="auction-btn approve"
                                  title="Approve Participant"
                                ><Check className="w-4 h-4" /></button>
                              )}
                              {participant.status !== 'rejected' && (
                                <button
                                  onClick={() => handleUpdateParticipantStatus(selectedAuction.id, participant.id, 'rejected')}
                                  className="auction-btn reject"
                                  title="Reject Participant"
                                ><X className="w-4 h-4" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Documents and Images */}
                <div className="modal-section">
                  <h3>Documents</h3>
                  <div className="modal-docs">
                    {selectedAuction.documents.map((doc: any, index) => {
                      const label = typeof doc === 'string' ? doc : (doc?.file_name || doc?.name || doc?.file_path || 'Document');
                      const href = typeof doc === 'object' ? (doc.file_path || doc.url || undefined) : undefined;
                      return (
                        <div key={index} className="doc-item">
                          <FileText className="w-4 h-4" />
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{label}</a>
                          ) : (
                            <span>{label}</span>
                          )}
                        </div>
                      );
                    })}
                    {!selectedAuction.documents.length && (
                      <div style={{ fontSize: 12, color: '#666' }}>No documents</div>
                    )}
                  </div>
                </div>



                {/* Terms and Conditions 
                <div className="modal-section" style={{ gridColumn: '1 / -1' }}>
                  <h3>Terms and Conditions</h3>
                  <div className="terms-box">
                    {selectedAuction.termsAndConditions}
                  </div>
                </div>
*/}
                {/* Admin Notes */}
                {(selectedAuction.adminNotes || selectedAuction.rejectionReason) && (
                  <div className="modal-section" style={{ gridColumn: '1 / -1' }}>
                    <h3>
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-600 inline" />
                      Admin Notes
                    </h3>
                    {selectedAuction.adminNotes && (
                      <div className="notes-box admin">
                        <strong>Notes:</strong> {selectedAuction.adminNotes}
                      </div>
                    )}
                    {selectedAuction.rejectionReason && (
                      <div className="notes-box rejection">
                        <strong>Rejection Reason:</strong> {selectedAuction.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              {selectedAuction.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveAuction(selectedAuction.id);
                      setSelectedAuction(null);
                    }}
                    className="approve"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Auction
                  </button>
                  <button
                    onClick={() => {
                      handleRejectAuction(selectedAuction.id, 'Admin rejected');
                      setSelectedAuction(null);
                    }}
                    className="reject"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Auction
                  </button>
                </>
              )}
              {selectedAuction.status !== 'rejected' && selectedAuction.status !== 'completed' && (
                <button
                  onClick={() => { handleCloseAuction(selectedAuction.id); setSelectedAuction(null); }}
                  className="reject"
                  title="Reject Auction (Admin)"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject Auction
                </button>
              )}
              <button
                onClick={() => setSelectedAuction(null)}
                className="close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAuctions;
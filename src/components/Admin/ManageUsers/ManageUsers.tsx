import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Phone,
  Mail,
  Building,
  Calendar,
  MapPin,
  Download,
  Upload,
  UserPlus,
  Users as UsersIcon,
  ChevronDown,
} from "lucide-react";

import "./ManageUser.css";
import userService, { NormalizedUserRecord } from '../../../services/userService';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'status-badge status-active';
    case 'pending':
      return 'status-badge status-pending';
    case 'blocked':
      return 'status-badge status-blocked';
    default:
      return 'status-badge';
  }
};

type User = NormalizedUserRecord;

const ManageUsers: React.FC = () => {
  const renderUserInfo = (user: User) => (
    <div className="user-info-section">
      <h4>Personal Information</h4>
      <div className="user-info-row">
        <div className="user-info-label">Name</div>
        <div className="user-info-value">{user.name}</div>
      </div>
      <div className="user-info-row">
        <div className="user-info-label">Phone</div>
        <div className="user-info-value">{formatPhoneNumber(user.phoneNumber)}</div>
      </div>
      <div className="user-info-row">
        <div className="user-info-label">Email</div>
        <div className="user-info-value">{user.email}</div>
      </div>
    </div>
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "pending" | "blocked"
  >("all");
  const [filterRole, setFilterRole] = useState<
    "all" | "auctioneer" | "participant"
  >("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Now you have a setter for limit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [confirmBlockUser, setConfirmBlockUser] = useState<User | null>(null);
  const [confirmApproveUser, setConfirmApproveUser] = useState<User | null>(null); // New state for approve popup

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.listUsers({
        page,
        limit,
        search: searchTerm.trim(),
        status: filterStatus === 'all' ? '' : filterStatus,
      });
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshIndex]);

  const displayUsers = users.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesRole;
  });
  const handleExportUsers = () => {
    if (!users.length) {
      alert("No users to export");
      return;
    }

    // Convert users to CSV
    const headers = ["Name", "Email", "Phone", "Company", "Role", "Status", "City", "Total Auctions", "Total Bids", "Winning Bids"];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.phoneNumber,
      user.companyName,
      user.role,
      user.status,
      user.city,
      user.totalAuctions,
      user.totalBids,
      user.winningBids
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
    link.download = "users_export.csv";
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after the download is initiated
    URL.revokeObjectURL(url);
  };

  // Inside the ManageUsers component in ManageUser.tsx

  const handleApproveUser = async (userId: string) => {
    try {
      await userService.approveUser(userId); // Call the new service function
      setRefreshIndex(i => i + 1); // Refresh the user list
      alert('User approved successfully.');
    } catch (e: any) {
      console.error('Failed to approve user:', e);
      setError(e.message || 'Failed to approve user. Please try again.');
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await userService.blockUser(userId); // Call the new service function
      setRefreshIndex(i => i + 1); // Refresh the user list
      alert('User blocked successfully.');
    } catch (e: any) {
      console.error('Failed to block user:', e);
      setError(e.message || 'Failed to block user. Please try again.');
    }
  };

  const handleViewDetails = async (user: User) => {
    try {
      const full = await userService.getUserById(user.id);
      setSelectedUser(full);
    } catch (e) {
      console.warn('Falling back to list user details due to error', e);
      setSelectedUser(user);
    }
  };
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';

    // 1. Remove non-numeric characters first, keeping only digits
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');

    // 2. Check if the number starts with the country code '91'
    const isIndianNumber = cleaned.startsWith('91');

    if (isIndianNumber && cleaned.length === 12) {
      // Matches '+91' followed by 10 digits
      const formatted = cleaned.slice(2); // Get the last 10 digits
      const match = formatted.match(/^(\d{5})(\d{5})$/);
      if (match) {
        return `+91 ${match[1]} ${match[2]}`;
      }
    }

    // 3. Handle a raw 10-digit number
    if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{5})(\d{5})$/);
      if (match) {
        return `+91 ${match[1]} ${match[2]}`;
      }
    }

    // 4. Return the original string if no format matches
    return phoneNumber;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-orange-600 bg-orange-100";
      case "blocked":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-orange-600 bg-orange-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="manage-users">
      <div className="manage-users-header">
        <h1>Manage Users</h1>
        <div className="manage-users-actions">
          <button className="btn btn-outline" onClick={handleExportUsers}>
            <Download className="btn-icon" />
            Export Users
          </button>
        </div>
      </div>

      <div className="manage-users-filters">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, company, phone, or email"
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <div className="filter-group">
            <label>Status</label>
            <div className="select-wrapper"> {/* Add this wrapper */}

              <select
                className="input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="pending-inactive">All Status</option>
                <option value="pending">Active</option>
                <option value="inactive">Blocked</option>
              </select>
              <ChevronDown className="dropdown-icon" /> {/* Add this icon */}


            </div>
          </div>
          <div className="filter-group">
            <label>Role&nbsp;&nbsp;&nbsp;</label>
            <select
              className="input"
              value="all"
              disabled
            >
              <option value="all">All Users</option>
            </select>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <div className="table-header">
          <h2 className="table-title">
            <UsersIcon className="btn-icon" />
            Users
          </h2>
        </div>
        <div className="table-wrapper">
          {error && (
            <div className="error-banner" style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 4, marginBottom: '0.5rem' }}>
              {error}
            </div>
          )}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Company Info</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label="User Details">
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-contact">
                          {formatPhoneNumber(user.phoneNumber)}
                        </div>
                        <div className="user-contact">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td data-label="Company Info">
                      <div className="company-info">
                        <div className="company-name">
                          {user.companyName}
                        </div>
                      </div>
                    </td>
                    <td data-label="Status">
                      <div className="status-container">
                        <span className={`user-status ${user.status}`}>
                          {user.status === 'inactive' ? 'Blocked' : 'Active'}
                        </span>
                        <div className="user-info-row">
                          <div className="user-info-label">Role</div>
                          <div className="user-info-value">{user.role === 'participant' ? 'User' : user.role}</div>                        </div>
                      </div>
                    </td>
                    <td data-label="Activity">
                      <div className="user-info-section">
                        <div className="user-info-row">
                          <div className="user-info-label">Auctions</div>
                          <div className="user-info-value">{user.totalAuctions}</div>
                        </div>
                        <div className="user-info-row">
                          <div className="user-info-label">Bids</div>
                          <div className="user-info-value">{user.totalBids}</div>
                        </div>
                        <div className="user-info-row">
                          <div className="user-info-label">Wins</div>
                          <div className="user-info-value">{user.winningBids}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="action-btn view"
                          title="View Details"
                        >
                          <Eye className="btn-icon" />
                        </button>



                        {user.status !== "blocked" && (
                          <button
                            onClick={() => setConfirmBlockUser(user)}
                            className="action-btn block"
                            title="Block User"
                          >
                            <X className="btn-icon" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!displayUsers.length && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ fontSize: 14 }}>
          Page {page} • Showing {users.length ? ((page - 1) * limit + 1) : 0}-{(page - 1) * limit + users.length}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn btn-outline"
          >Prev</button>
          <button
            onClick={() => setPage(p => p + 1)}
            className="btn btn-outline"
          >Next</button>
        </div>
      </div>

      {/* Block User Confirmation Popup */}
      {confirmBlockUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3 className="confirm-modal-title">Block User</h3>
              <button
                onClick={() => setConfirmBlockUser(null)}
                className="confirm-modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="confirm-modal-content">
              <p>Are you sure you want to block <strong>{confirmBlockUser.name}</strong>? This action will prevent the user from accessing their account.</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                onClick={() => setConfirmBlockUser(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleBlockUser(confirmBlockUser.id);
                  setConfirmBlockUser(null);
                }}
                className="btn btn-danger"
              >
                Yes, Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve User Confirmation Popup */}
      {confirmApproveUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3 className="confirm-modal-title">Approve User</h3>
              <button
                onClick={() => setConfirmApproveUser(null)}
                className="confirm-modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="confirm-modal-content">
              <p>Are you sure you want to approve <strong>{confirmApproveUser.name}</strong>? This will give the user full access to the platform.</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                onClick={() => setConfirmApproveUser(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="user-modal">
            <div className="user-modal-header">
              <h2 className="user-modal-title">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="user-modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="user-modal-content">
              {renderUserInfo(selectedUser)}

              <div className="user-info-section">
                <h4>Company Information</h4>
                <div className="user-info-row">
                  <div className="user-info-label">Company</div>
                  <div className="user-info-value">{selectedUser.companyName}</div>
                </div>
              </div>

              <div className="user-info-section">
                <h4>Address Information</h4>
                <div className="user-info-row">
                  <div className="user-info-label">City</div>
                  <div className="user-info-value">{selectedUser.companyAddress}</div>
                </div>
              </div>

              <div className="user-info-section">
                <h4>Activity Information</h4>
                <div className="user-info-row">
                  <div className="user-info-label">Auctions</div>
                  <div className="user-info-value">{selectedUser.totalAuctions}</div>
                </div>
                <div className="user-info-row">
                  <div className="user-info-label">Total Bids</div>
                  <div className="user-info-value">{selectedUser.totalBids}</div>
                </div>
                <div className="user-info-row">
                  <div className="user-info-label">Winning Bids</div>
                  <div className="user-info-value">{selectedUser.winningBids}</div>
                </div>

              </div>

              <div className="user-info-section" style={{ gridColumn: 'span 2' }}>
                <h4>Documents Submitted</h4>
                <div className="user-info-docs">
                  {selectedUser.documentsSubmitted && selectedUser.documentsSubmitted.map((doc, index) => (
                    <span key={index} className="document-tag">
                      {doc}
                    </span>
                  ))}
                </div>
                {selectedUser.verificationNotes && (
                  <div className="user-info-row" style={{ marginTop: '1rem' }}>
                    <div className="user-info-label">Notes</div>
                    <div className="user-info-value">{selectedUser.verificationNotes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="user-modal-actions">


              {selectedUser.status !== "blocked" && (
                <button
                  onClick={() => {
                    // Close the details modal and show the confirmation modal
                    setSelectedUser(null);
                    setConfirmBlockUser(selectedUser);
                  }}
                  className="block"
                >
                  <X className="w-5 h-5" />
                  Block User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
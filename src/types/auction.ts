// Auction Type Definitions
export interface BaseAuction {
  id: string;
  // Original backend identifier (may differ from synthetic id we generate as fallback)
  backendId?: string;
  title: string;
  auctionNo: string;
  auctionDate: string;
  // Raw backend field (e.g., "Sep 3, 2025") preserved if needed for display or debugging
  rawAuctionDate?: string;
  auctionStartTime: string;
  auctionEndTime?: string;
  duration: number;
  currency: 'INR' | 'USD';
  auctionDetails: string;
  openToAllCompanies: boolean;
  preBidOfferAllowed: boolean;
  decrementalValue?: number;
  startingPrice?: number;
  reservePrice?: number;
  userId?: string; // For backward compatibility with existing code
  auctioneerCompany?: string;
  auctioneerAddress?: string;
  auctioneerPhone?: string;
  status: 'upcoming' | 'live' | 'completed';
  participants: string[]; // Array of participant IDs
  documents: AuctionDocument[];
  createdBy: string; // User ID who created the auction
  createdAt: string;
  updatedAt: string;
}

export interface AuctionDocument {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

export interface AuctionParticipant {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  phoneNumber: string;
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  preBidOffer?: number;
  bidAmount: number;
  lastBidTime: string;
  isWinning?: boolean;
  joinedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  userId: string;
  amount: number;
  timestamp: string;
  status: 'active' | 'outbid' | 'winning';
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'auctioneer' | 'participant' | 'admin';
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  isVerified: boolean;
  createdAt: string;
}

// Form interfaces for creating/editing
export interface CreateAuctionData {
  title: string;
  auctionDate: string;
  auctionStartTime: string;
  duration: number;
  currency: 'INR' | 'USD';
  auctionDetails: string;
  openToAllCompanies: boolean;
  preBidOfferAllowed: boolean;
  decrementalValue?: number;
  documents?: File[];
}

export interface ParticipantRegistrationData {
  auctionId: string;
  phoneNumber: string;
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  preBidOffer?: number;
}
// types.ts
// src/types/auction.ts
export interface CreateAuctionRequest {
  title: string;
  description: string;
  auction_date: string;   // e.g. "2025-09-01"
  start_time: string;     // e.g. "14:00:00"
  duration: number;       // in seconds
  currency: string;       // "INR" | "USD"
  base_price: number;     // numeric
  decremental_value: number; // numeric
  pre_bid_allowed: boolean;
  send_invitations: boolean;
  participants?: string[];
}
import LocalStorageService from './localStorageService';
import { BaseAuction, AuctionParticipant, AuctionBid, User, CreateAuctionData, ParticipantRegistrationData, AuctionDocument } from '../types/auction';

// Storage keys (no static data seeding)
const STORAGE_KEYS = {
  AUCTIONS: 'auction_app_auctions',
  PARTICIPANTS: 'auction_app_participants',
  BIDS: 'auction_app_bids',
  USERS: 'auction_app_users',
  CURRENT_USER: 'auction_app_current_user',
  DOCUMENTS: 'auction_app_documents'
};

class AuctionService {
  // ---------- Internal Helpers ----------
  private static generateId(): string {
    return 'id_' + Math.random().toString(36).slice(2, 10);
  }

  private static ensureArrays() {
    [STORAGE_KEYS.AUCTIONS, STORAGE_KEYS.PARTICIPANTS, STORAGE_KEYS.BIDS, STORAGE_KEYS.USERS, STORAGE_KEYS.DOCUMENTS]
      .forEach(k => { if (!LocalStorageService.getItem(k)) LocalStorageService.setItem(k, []); });
  }

  // Call once when file is loaded
  static init() { this.ensureArrays(); }
  // Backward compatibility: legacy code called initializeData() to seed sample data.
  // We have removed all static seeding; this is now a no-op wrapper ensuring storage keys exist.
  static initializeData() { this.init(); }

  // ---------- User Management ----------
  static getAllUsers(): User[] {
    return LocalStorageService.getItem<User[]>(STORAGE_KEYS.USERS) || [];
  }
  static saveUsers(users: User[]) {
    LocalStorageService.setItem(STORAGE_KEYS.USERS, users);
  }
  static getCurrentUser(): User | null { return LocalStorageService.getItem<User>(STORAGE_KEYS.CURRENT_USER); }
  static setCurrentUser(user: User) { LocalStorageService.setItem(STORAGE_KEYS.CURRENT_USER, user); }
  static getUserById(id: string): User | null { return this.getAllUsers().find(u => u.id === id) || null; }
  static getUserByPhone(phone: string): User | null { return this.getAllUsers().find(u => u.phoneNumber === phone) || null; }
  static createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getAllUsers();
    const user: User = { ...data, id: this.generateId(), createdAt: new Date().toISOString() };
    users.push(user); this.saveUsers(users); return user;
  }
  static findOrCreateUserByPhone(phone: string): User {
    return this.getUserByPhone(phone) || this.createUser({ phoneNumber: phone, role: 'participant', companyName: '', companyAddress: '', personName: '', mailId: '', isVerified: false });
  }

  // ---------- Auction Management ----------
  static getAllAuctions(): BaseAuction[] { return LocalStorageService.getItem<BaseAuction[]>(STORAGE_KEYS.AUCTIONS) || []; }
  static saveAuctions(list: BaseAuction[]) { LocalStorageService.setItem(STORAGE_KEYS.AUCTIONS, list); }
  static getAuctionById(id: string): BaseAuction | null {
    return this.getAllAuctions().find(a => a.id === id || (a as any).backendId === id || a.auctionNo === id) || null;
  }
  static generateAuctionNo(): string { return 'AUC-' + Date.now(); }
  static createAuction(data: CreateAuctionData, createdBy: string): BaseAuction {
    const auctions = this.getAllAuctions();
    const a: BaseAuction = { ...data, id: this.generateId(), auctionNo: this.generateAuctionNo(), status: 'upcoming', participants: [], documents: [], userId: createdBy, createdBy, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as BaseAuction;
    auctions.push(a); this.saveAuctions(auctions); return a;
  }
  static updateAuction(id: string, partial: Partial<BaseAuction>): BaseAuction | null {
    const auctions = this.getAllAuctions();
    const idx = auctions.findIndex(a => a.id === id);
    if (idx === -1) return null;
    auctions[idx] = { ...auctions[idx], ...partial, updatedAt: new Date().toISOString() } as BaseAuction;
    this.saveAuctions(auctions); return auctions[idx];
  }
  static deleteAuction(id: string): boolean {
    const auctions = this.getAllAuctions();
    const idx = auctions.findIndex(a => a.id === id);
    if (idx === -1) return false;
    auctions.splice(idx, 1); this.saveAuctions(auctions);
    this.deleteParticipantsByAuction(id); this.deleteBidsByAuction(id);
    return true;
  }
  static getAuctionsByUser(userId: string): BaseAuction[] { return this.getAllAuctions().filter(a => a.createdBy === userId); }
  static getAuctionsForParticipant(userId: string): BaseAuction[] {
    const parts = this.getAllParticipants().filter(p => p.userId === userId);
    return this.getAllAuctions().filter(a => parts.some(p => p.auctionId === a.id) || a.openToAllCompanies);
  }
  static forceReseedSampleData() { // now only clears local caches
    this.saveAuctions([]); this.saveParticipants([]); this.saveBids([]); LocalStorageService.setItem(STORAGE_KEYS.DOCUMENTS, []); }

  // ---------- Participant Management ----------
  static getAllParticipants(): AuctionParticipant[] { return LocalStorageService.getItem<AuctionParticipant[]>(STORAGE_KEYS.PARTICIPANTS) || []; }
  static saveParticipants(list: AuctionParticipant[]) { LocalStorageService.setItem(STORAGE_KEYS.PARTICIPANTS, list); }
  static getParticipantsByAuction(auctionId: string): AuctionParticipant[] { return this.getAllParticipants().filter(p => p.auctionId === auctionId); }
  static joinAuction(data: ParticipantRegistrationData, userId: string): AuctionParticipant {
    const participants = this.getAllParticipants();
    if (participants.some(p => p.auctionId === data.auctionId && p.userId === userId)) throw new Error('Already joined');
    const p: AuctionParticipant = { ...data, id: this.generateId(), userId, userName: data.personName, userPhone: data.phoneNumber, bidAmount: 0, lastBidTime: new Date().toISOString(), joinedAt: new Date().toISOString(), status: 'approved' };
    participants.push(p); this.saveParticipants(participants);
    const auctions = this.getAllAuctions(); const a = auctions.find(a => a.id === data.auctionId); if (a && !a.participants.includes(userId)) { a.participants.push(userId); this.saveAuctions(auctions); }
    return p;
  }
  static deleteParticipantsByAuction(auctionId: string) { this.saveParticipants(this.getAllParticipants().filter(p => p.auctionId !== auctionId)); }
  static getAuctionParticipants(auctionId: string): AuctionParticipant[] { return this.getParticipantsByAuction(auctionId); }

  // ---------- Bid Management ----------
  static getAllBids(): AuctionBid[] { return LocalStorageService.getItem<AuctionBid[]>(STORAGE_KEYS.BIDS) || []; }
  static saveBids(list: AuctionBid[]) { LocalStorageService.setItem(STORAGE_KEYS.BIDS, list); }
  static getBidsByAuction(auctionId: string): AuctionBid[] { return this.getAllBids().filter(b => b.auctionId === auctionId).sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); }
  static placeBid(auctionId: string, userId: string, amount: number): AuctionBid {
    const bids = this.getAllBids(); bids.forEach(b => { if (b.auctionId === auctionId && b.status === 'winning') b.status = 'outbid'; });
    const bid: AuctionBid = { id: this.generateId(), auctionId, userId, amount, timestamp: new Date().toISOString(), status: 'winning' };
    bids.push(bid); this.saveBids(bids); return bid;
  }
  static deleteBidsByAuction(auctionId: string) { this.saveBids(this.getAllBids().filter(b => b.auctionId !== auctionId)); }

  // ---------- Documents ----------
  static addDocumentToAuction(auctionId: string, doc: AuctionDocument): boolean {
    const auctions = this.getAllAuctions(); const a = auctions.find(a => a.id === auctionId); if (!a) return false; a.documents.push(doc); a.updatedAt = new Date().toISOString(); this.saveAuctions(auctions); return true; }
  static removeDocumentFromAuction(auctionId: string, docId: string): boolean { const auctions = this.getAllAuctions(); const a = auctions.find(a => a.id === auctionId); if(!a) return false; a.documents = a.documents.filter(d => d.id !== docId); a.updatedAt = new Date().toISOString(); this.saveAuctions(auctions); return true; }

  // ---------- Search & Stats ----------
  static searchAuctions(query: string, status?: string): BaseAuction[] {
    return this.getAllAuctions().filter(a => {
      const q = query?.toLowerCase() || '';
      const matchesQ = !q || a.title.toLowerCase().includes(q) || a.auctionNo.toLowerCase().includes(q) || a.auctionDetails.toLowerCase().includes(q);
      const matchesStatus = !status || status === 'all' || a.status === status;
      return matchesQ && matchesStatus;
    });
  }
  static getAuctionStats(userId?: string) { const list = userId ? this.getAuctionsByUser(userId) : this.getAllAuctions(); return { total: list.length, live: list.filter(a=>a.status==='live').length, upcoming: list.filter(a=>a.status==='upcoming').length, completed: list.filter(a=>a.status==='completed').length }; }

  // ---------- Data Export / Import ----------
  static exportData(): string { return JSON.stringify({ auctions: this.getAllAuctions(), participants: this.getAllParticipants(), bids: this.getAllBids(), users: this.getAllUsers(), exportedAt: new Date().toISOString() }, null, 2); }
  static importData(json: string): boolean { try { const d = JSON.parse(json); if(d.auctions) this.saveAuctions(d.auctions); if(d.participants) this.saveParticipants(d.participants); if(d.bids) this.saveBids(d.bids); if(d.users) this.saveUsers(d.users); return true; } catch(e){ console.error('import error', e); return false; } }

  // ---------- Clear ----------
  static clearAllData() { Object.values(STORAGE_KEYS).forEach(k => LocalStorageService.removeItem(k)); this.ensureArrays(); }
}

AuctionService.init();
export default AuctionService;
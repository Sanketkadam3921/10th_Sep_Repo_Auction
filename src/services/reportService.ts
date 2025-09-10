// src/services/reportService.ts
const API_BASE_URL = 'https://auction-development.onrender.com/api/auctionreports';

export interface AuctionReport {
    decremental_value: string;
    auctionDate: string;
    auctionStartTime: string;
    currency: any;
    auction_details: string;
    id: number;
    title: string;
    description: string;
    auction_date: string;
    start_time: string;
    base_price: string;
    current_price: string;
    bids: AuctionBidSummary[];
}

export interface AuctionBidSummary {
    company_name: string;
    pre_bid_offer: string;
    final_bid_offer: string;
    bid_rank: number;
}

class ReportService {
    private async makeRequest<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error(`Report API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Fetch full auction report with bids
    async getAuctionReport(auctionId: number): Promise<AuctionReport> {
        return this.makeRequest<AuctionReport>(`/auctions/${auctionId}/report`);
    }

    // Fetch all auctions (for dropdown)
    async getAllAuctions(): Promise<{ id: number; title: string }[]> {
        return this.makeRequest<{ id: number; title: string }[]>(`/auctions`, 'GET');
    }
}

export default new ReportService();
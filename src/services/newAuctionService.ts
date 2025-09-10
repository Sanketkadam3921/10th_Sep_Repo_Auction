const API_BASE_URL = "https://auction-development.onrender.com/api/auction";

export interface CreateAuctionRequest {
    title: string;
    description: string;
    auction_date: string;
    start_time: string;
    duration: number;
    currency: string;
    base_price: number;
    decremental_value: number;
    pre_bid_allowed?: boolean;
    participants?: string[];
    send_invitations?: boolean;
}

export interface AddParticipantsRequest {
    auction_id: number;
    participants: string[];
    send_invitations?: boolean;
}

export interface PlaceBidRequest {
    auction_id: number;
    amount: number;
}

export interface JoinAuctionRequest {
    auction_id: number;
    phone_number: string;
}

export interface AuctionResponse {
    success: boolean;
    message: string;
    auction?: any;
    participants?: string[];
    // Legacy field (older responses)
    smsResults?: {
        successfulSMS: number;
        failedSMS: number;
        failures: string[];
    };
    // New response field
    invitationResults?: {
        totalParticipants: number;
        successfulSMS: number;
        successfulWhatsApp: number;
        failures: Array<{ participant: string; type: string; error?: any }>;
    };
}

class AuctionService {
    // 🔑 Get Auth Token (robust & safe)
    private getAuthToken(): string | null {
        try {
            const token =
                localStorage.getItem("accessToken") ||
                localStorage.getItem("token") ||
                localStorage.getItem("authToken") ||
                sessionStorage.getItem("accessToken") ||
                sessionStorage.getItem("token");

            if (token) return token.startsWith("Bearer ") ? token.slice(7) : token;

            // Try extracting from "user" object
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                return user?.token || user?.accessToken || user?.authToken || null;
            }

            return null;
        } catch {
            return null;
        }
    }

    // 🔑 Auth headers
    private getAuthHeaders(isJson = true): Record<string, string> {
        const token = this.getAuthToken();
        if (!token) throw new Error("Authentication required. Please log in again.");

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
        };

        if (isJson) headers["Content-Type"] = "application/json";

        return headers;
    }

    // 🌐 Standardized fetch handler
    private async handleRequest<T>(
        endpoint: string,
        options: RequestInit
    ): Promise<T> {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                const msg =
                    result?.message ||
                    ({
                        401: "Authentication failed. Please log in again.",
                        403: "Access forbidden.",
                        413: "Payload too large. Please reduce file size.",
                        500: "Server error. Please try again later.",
                    }[response.status] || `HTTP error ${response.status}`);

                throw new Error(msg);
            }

            return result as T;
        } catch (err: any) {
            if (err.name === "TypeError" && err.message.includes("fetch")) {
                throw new Error("Network error. Please check your internet connection.");
            }
            throw err;
        }
    }

    // 📌 Create Auction
    async createAuction(
        data: CreateAuctionRequest,
        files: File[] = []
    ): Promise<AuctionResponse> {
        if (!data.title?.trim()) throw new Error("Auction title is required");
        if (!data.auction_date) throw new Error("Auction date is required");
        if (!data.start_time) throw new Error("Start time is required");
        if (!data.duration || data.duration <= 0)
            throw new Error("Valid duration is required");

        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach((v) => formData.append(key, String(v)));
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        files.forEach((file) => formData.append("documents", file));

        return this.handleRequest<AuctionResponse>("/create", {
            method: "POST",
            headers: this.getAuthHeaders(false),
            body: formData,
        });
    }

    // 📌 Add Participants
    async addParticipants(
        data: AddParticipantsRequest
    ): Promise<AuctionResponse> {
        return this.handleRequest<AuctionResponse>("/participants/add", {
            method: "POST",
            headers: this.getAuthHeaders(true),
            body: JSON.stringify(data),
        });
    }

    // 📌 Place Bid
    async placeBid(data: PlaceBidRequest): Promise<AuctionResponse> {
        return this.handleRequest<AuctionResponse>("/bid", {
            method: "POST",
            headers: this.getAuthHeaders(true),
            body: JSON.stringify(data),
        });
    }

    // 📌 Join Auction
    async joinAuction(data: JoinAuctionRequest): Promise<AuctionResponse> {
        return this.handleRequest<AuctionResponse>("/join", {
            method: "POST",
            headers: this.getAuthHeaders(true),
            body: JSON.stringify(data),
        });
    }

    // 👤 Helpers
    isAuthenticated(): boolean {
        return this.getAuthToken() !== null;
    }

    clearAuth(): void {
        ["accessToken", "token", "authToken", "user"].forEach((k) =>
            localStorage.removeItem(k)
        );
        ["accessToken", "token"].forEach((k) => sessionStorage.removeItem(k));
    }
}

export default new AuctionService();
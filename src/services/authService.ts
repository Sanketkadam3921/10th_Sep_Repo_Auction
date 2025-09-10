const API_BASE_URL = 'https://auction-development.onrender.com/api/auth';

export interface RegisterRequest {
  phone_number: string;
  email?: string;
  person_name?: string;
  company_name?: string;
  company_address?: string;
}

export interface SendOTPRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  sessionId: string;
  otp: string;
  phone_number: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
  user?: any;
  sessionId?: string;
}

class AuthService {
  private async makeRequest(endpoint: string, data: any): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Auth API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.makeRequest('/signup', data);
  }

  async sendOTP(data: SendOTPRequest): Promise<AuthResponse> {
    return this.makeRequest('/send-otp', data);
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    return this.makeRequest('/verify-otp', data);
  }
}

export default new AuthService();

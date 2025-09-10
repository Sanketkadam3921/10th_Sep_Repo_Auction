import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  role: 'auctioneer' | 'participant' | 'admin';
  isVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (phoneNumber: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Minimal first-pass: load stored user quickly so UI can render.
    const storedUserRaw = localStorage.getItem('auctionUser');
    let parsedUser: User | null = null;
    if (storedUserRaw) {
      try { parsedUser = JSON.parse(storedUserRaw); } catch { /* ignore */ }
    }
    if (parsedUser) setUser(parsedUser);
    setLoading(false); // Let UI paint.

  // Removed dev admin token auto-inject. Use manual token input in Admin Dashboard instead.

    // Defer heavy initialization to next tick (auctions sample data etc.).
    queueMicrotask(() => {
      if (parsedUser) {
        try {
          const AuctionService = require('../services/auctionService').default;
          AuctionService.setCurrentUser(parsedUser);
          // Run initialization asynchronously to avoid blocking.
          setTimeout(() => {
            try { AuctionService.initializeData(); } catch (e) { console.warn('Auction data init failed', e); }
          }, 0);
        } catch (e) { console.warn('Auction service init error', e); }
      }

      // Background profile refresh (won't block initial paint)
      const token = localStorage.getItem('authToken');
      if (token) {
        profileService.getProfile(token)
          .then(res => {
            if (!res?.user) return;
            const backendUser: any = res.user;
            const merged: User = {
              id: backendUser.id || backendUser.user_id || parsedUser?.id || Date.now().toString(),
              phoneNumber: backendUser.phoneNumber || backendUser.phone_number || parsedUser?.phoneNumber || '',
              name: backendUser.name || backendUser.personName || backendUser.person_name || parsedUser?.name,
              email: backendUser.email || backendUser.mailId || parsedUser?.email,
              companyName: backendUser.companyName || backendUser.company_name || parsedUser?.companyName || '',
              companyAddress: backendUser.companyAddress || backendUser.company_address || parsedUser?.companyAddress || '',
              personName: backendUser.personName || backendUser.person_name || backendUser.name || parsedUser?.personName || '',
              mailId: backendUser.mailId || backendUser.email || parsedUser?.mailId || '',
              role: (backendUser.role || parsedUser?.role || 'participant') as User['role'],
              isVerified: backendUser.isVerified ?? parsedUser?.isVerified ?? true,
              createdAt: backendUser.createdAt || backendUser.created_at || parsedUser?.createdAt || new Date().toISOString(),
            };
            setUser(prev => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
            localStorage.setItem('auctionUser', JSON.stringify(merged));
          })
          .catch(err => {
            console.warn('Profile sync failed:', err?.message || err);
          });
      }
    });
  }, []);

  const login = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
      }

      // Call send OTP API
      const response = await authService.sendOTP({
        phone_number: formattedPhone,
      });

      if (response.success) {
        // Store phone number and session ID for OTP verification
        localStorage.setItem('pendingPhoneNumber', formattedPhone);
        
        // Store session ID if provided by the API
        if (response.data && response.data.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId);
        } else if (response.sessionId) {
          localStorage.setItem('sessionId', response.sessionId);
        }
        
        console.log(`OTP sent to ${formattedPhone}`);
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<void> => {
    setLoading(true);
    try {
      const phoneNumber = localStorage.getItem('pendingPhoneNumber');
      const sessionId = localStorage.getItem('sessionId');
      if (!phoneNumber) {
        throw new Error('No pending phone number found');
      }
      if (!sessionId) {
        throw new Error('Session ID not found. Please request OTP again.');
      }

      // Validate OTP format
      if (!/^\d{4,8}$/.test(otp)) {
        throw new Error('Invalid OTP format');
      }

      // Call verify OTP API
      const response = await authService.verifyOTP({
        sessionId: sessionId,
        otp: otp.trim(),
        phone_number: phoneNumber,
      });

      if (response.success) {
        // Handle successful verification
        let userData: User;

        if (response.user) {
          // Use user data from API response
          userData = {
            id: response.user.id || Date.now().toString(),
            phoneNumber: response.user.phoneNumber || phoneNumber,
            name: response.user.name || response.user.personName,
            email: response.user.email || response.user.mailId,
            companyName: response.user.companyName || 'Please update your company',
            companyAddress: response.user.companyAddress || 'Please update your address',
            personName: response.user.personName || response.user.name || 'Please update your name',
            mailId: response.user.mailId || response.user.email || 'Please update your email',
            role: response.user.role || 'participant',
            isVerified: response.user.isVerified || true,
            createdAt: response.user.createdAt || new Date().toISOString()
          };
        } else {
          // Fallback: Check existing users or create new one
          const AuctionService = require('../services/auctionService').default;
          const normalizedPhone = phoneNumber.replace(/\D/g, '');
          let existingUser = AuctionService.getUserByPhone(phoneNumber) ||
                           AuctionService.getUserByPhone(`+91${normalizedPhone}`) ||
                           AuctionService.getUserByPhone(normalizedPhone);
          
          if (existingUser) {
            userData = {
              id: existingUser.id,
              phoneNumber: existingUser.phoneNumber,
              name: existingUser.personName,
              email: existingUser.mailId,
              companyName: existingUser.companyName,
              companyAddress: existingUser.companyAddress,
              personName: existingUser.personName,
              mailId: existingUser.mailId,
              role: existingUser.role,
              isVerified: existingUser.isVerified,
              createdAt: existingUser.createdAt
            };
          } else {
            // Create new user
            let newUserId = Date.now().toString();
            let userRole: 'auctioneer' | 'participant' | 'admin' = 'participant';
            
            // Handle special demo phone numbers
            if (normalizedPhone === '9876543210' || phoneNumber.includes('9876543210')) {
              newUserId = 'user1';
              userRole = 'auctioneer';
            } else if (normalizedPhone === '9123456789' || phoneNumber.includes('9123456789')) {
              newUserId = 'user2';
              userRole = 'participant';
            } else if (normalizedPhone === '8765432109' || phoneNumber.includes('8765432109')) {
              newUserId = 'user3';
              userRole = 'participant';
            } else if (normalizedPhone === '9999999999' || phoneNumber.includes('9999999999')) {
              newUserId = 'admin1';
              userRole = 'admin';
            }
            
            userData = {
              id: newUserId,
              phoneNumber,
              name: 'New User',
              email: '',
              companyName: 'Please update your company',
              companyAddress: 'Please update your address',
              personName: 'Please update your name',
              mailId: 'Please update your email',
              role: userRole,
              isVerified: true,
              createdAt: new Date().toISOString()
            };
          }
        }

        console.log('Login successful:', { id: userData.id, phone: userData.phoneNumber, role: userData.role });
        setUser(userData);
        localStorage.setItem('auctionUser', JSON.stringify(userData));
        
        // Store auth token if provided
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }

        localStorage.removeItem('pendingPhoneNumber');
        localStorage.removeItem('sessionId');
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    profileService.clearCache();
    localStorage.removeItem('auctionUser');
    localStorage.removeItem('pendingPhoneNumber');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('authToken');
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    setLoading(true);
    try {
      // Build backend payload (avoid sending unchanged phone unless modified)
      const payload: any = {};
      if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
        // Normalize +91 prefix
        let pn = data.phoneNumber.trim();
        if (!pn.startsWith('+')) pn = '+91' + pn.replace(/^0+/, '');
        payload.phone_number = pn;
      }
      if (data.name || data.personName) payload.person_name = data.name || data.personName;
      if (data.email || data.mailId) payload.email = data.email || data.mailId;
      if (data.companyName) payload.company_name = data.companyName;
      if (data.companyAddress) payload.company_address = data.companyAddress;

      // Call backend update
      // Optimistic UI update first
      const optimistic: User = { ...user,
        phoneNumber: payload.phone_number ? payload.phone_number : user.phoneNumber,
        name: payload.person_name || data.name || user.name,
        email: payload.email || data.email || user.email,
        companyName: payload.company_name || data.companyName || user.companyName,
        companyAddress: payload.company_address || data.companyAddress || user.companyAddress,
        personName: payload.person_name || data.name || user.personName,
        mailId: payload.email || data.email || user.mailId,
      } as User;
      setUser(optimistic);

      const response = await profileService.updateProfile(user.id, payload);
      const backendUser: any = response.user || {};
      const merged: User = { ...optimistic,
        phoneNumber: backendUser.phoneNumber || backendUser.phone_number || optimistic.phoneNumber,
        name: backendUser.name || backendUser.personName || backendUser.person_name || optimistic.name,
        email: backendUser.email || backendUser.mailId || optimistic.email,
        companyName: backendUser.companyName || backendUser.company_name || optimistic.companyName,
        companyAddress: backendUser.companyAddress || backendUser.company_address || optimistic.companyAddress,
        personName: backendUser.personName || backendUser.person_name || backendUser.name || optimistic.personName,
        mailId: backendUser.mailId || backendUser.email || optimistic.mailId,
        role: backendUser.role || optimistic.role,
        isVerified: backendUser.isVerified ?? optimistic.isVerified,
        createdAt: backendUser.createdAt || backendUser.created_at || optimistic.createdAt,
      };
      setUser(prev => JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged);
      localStorage.setItem('auctionUser', JSON.stringify(merged));
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
      }

      // Call send OTP API for password reset
      const response = await authService.sendOTP({
        phone_number: formattedPhone,
      });

      if (response.success) {
        // Store phone number and session ID for OTP verification
        localStorage.setItem('pendingPhoneNumber', formattedPhone);
        
        // Store session ID if provided by the API
        if (response.data && response.data.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId);
        } else if (response.sessionId) {
          localStorage.setItem('sessionId', response.sessionId);
        }
        
        console.log(`Password reset OTP sent to ${formattedPhone}`);
      } else {
        throw new Error(response.message || "Failed to send reset OTP");
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    verifyOTP,
    logout,
    updateProfile,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { Phone, ArrowRight, Gavel } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from "lucide-react"; // or User, KeyRound, etc.

interface LoginForm {
  phoneNumber: string;
}

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (phoneNumber.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error('Phone number must contain only digits');
      return;
    }

    // Check for admin default login
    if (phoneNumber === '9999999999') {
      localStorage.setItem('pendingPhoneNumber', '+91' + phoneNumber);
      localStorage.setItem('isAdminLogin', 'true');
      toast.success('Admin login - Please enter OTP: 123456');
      navigate('/verify-otp');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = '+91' + phoneNumber.trim();

      await login(formattedPhone);
      toast.success('OTP sent successfully!');
      navigate('/verify-otp');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ap-login-wrapper">
      <div className="ap-login-card">
        <div className="ap-login-header">
          <div className="ap-login-logo-row">
            <div className="ap-login-logo-badge">
              <Gavel className="ap-login-logo-icon" />
            </div>
            <div>
              <div className="ap-login-brand-title">Quickauction</div>
              <div className="ap-login-brand-sub">Welcome back! Please log in to continue</div>
            </div>
          </div>
        </div>

        <div className="ap-login-inner">

          <div className="ap-login-form-header">
            <h2 className="ap-login-form-title">
              <LogIn className="ap-login-form-icon" />
              Login
            </h2>
            <p className="ap-login-form-subtitle">
              Enter your phone number to receive an OTP
            </p>
          </div>

          <div className="ap-login-form-body">
            <form onSubmit={onSubmit} className="ap-login-form">
              <div className="ap-login-form-group">
                <label htmlFor="phoneNumber" className="ap-login-label">
                  Phone No. <span style={{ color: "red" }}>*</span>
                </label>

                <div className="ap-login-input-wrapper">
                  <input
                    type="tel"
                    id="phoneNumber"
                    className="ap-login-input"
                    placeholder='1234567890'
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    required
                    title="Enter exactly 10 digits"
                  />
                  <div className="ap-login-prefix">+91</div>
                </div>
                <small className="ap-login-hint">Enter exactly 10 digits (no spaces or symbols)</small>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                className="ap-login-btn"
              >
                {isLoading ? (
                  <div className="ap-login-spinner" />
                ) : (
                  <>
                    Save & Send OTP
                    <ArrowRight className="ap-login-btn-icon" />
                  </>
                )}
              </button>
            </form>
          </div>
          {/** 
          <div className="ap-login-footer">
          
            <p className="ap-login-footer-text">
              Forgot Password?{' '}
              <Link to="/forgot-password" className="ap-login-footer-link">
                Send OTP - SMS Type 1
              </Link>
            </p>
          </div>*/}
          <div className="ap-login-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p className="ap-login-footer-text">
              New here?{' '}
              <Link to="/register" className="ap-login-footer-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="ap-login-backhome">
          <Link to="/" className="ap-login-backhome-link">
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
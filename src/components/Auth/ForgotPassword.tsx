import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { useForm } from 'react-hook-form';
import { KeyRound, ArrowRight, Gavel } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  phoneNumber: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      let formattedPhone = data.phoneNumber.trim();
      
      // Add country code if not present
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
      }
      
      await forgotPassword(formattedPhone);
      toast.success('Password reset OTP sent successfully!');
      navigate('/verify-otp');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ap-forgot-wrapper">
      <div className="ap-forgot-card">
        {/* Logo/Header */}
        <div className="ap-forgot-header">
          <div className="ap-forgot-logo-row">
            <div className="ap-forgot-logo-badge">
              <Gavel className="ap-forgot-logo-icon" />
            </div>
            <div>
              <div className="ap-forgot-brand-title">AuctionPro</div>
              <div className="ap-forgot-brand-sub">Reset your account password</div>
            </div>
          </div>
        </div>

        {/* Forgot Password Form */}
        <div className="ap-forgot-inner">
          <div className="ap-forgot-form-header">
            <h2 className="ap-forgot-form-title">
              <KeyRound className="ap-forgot-form-icon" />
              Forgot Password
            </h2>
            <p className="ap-forgot-form-subtitle">
              Enter your phone number to receive a password reset OTP
            </p>
          </div>
          
          <div className="ap-forgot-form-body">
            <form onSubmit={handleSubmit(onSubmit)} className="ap-forgot-form">
              <div className="ap-forgot-form-group">
                <label htmlFor="phoneNumber" className="ap-forgot-label">
                  Phone No. *
                </label>
                <div className="ap-forgot-input-wrapper">
                  <input
                    type="tel"
                    id="phoneNumber"
                    className={`ap-forgot-input ${errors.phoneNumber ? 'ap-forgot-error' : ''}`}
                    placeholder="Enter your phone number"
                    {...register('phoneNumber', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^(\+91)?[6-9]\d{9}$/,
                        message: 'Please enter a valid Indian phone number',
                      },
                    })}
                  />
                  <div className="ap-forgot-prefix">+91</div>
                </div>
                {errors.phoneNumber && (
                  <div className="ap-forgot-error-msg">
                    {errors.phoneNumber.message}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="ap-forgot-btn"
              >
                {isLoading ? (
                  <div className="ap-forgot-spinner" />
                ) : (
                  <>
                    Send Reset OTP
                    <ArrowRight className="ap-forgot-btn-icon" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="ap-forgot-footer">
            <p className="ap-forgot-footer-text">
              Remember your password?{' '}
              <Link to="/login" className="ap-forgot-footer-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
                

        {/* Back to Home */}
        <div className="ap-forgot-backhome">
          <Link to="/" className="ap-forgot-backhome-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

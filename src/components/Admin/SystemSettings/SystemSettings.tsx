import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Bell, Mail, Phone, IndianRupee, Clock, Shield, Database, Globe, Smartphone } from 'lucide-react';
interface SystemConfig {
  // General Settings
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  timezone: string;
  currency: string;
  language: string;

  // Auction Settings
  defaultAuctionDuration: number;
  maxAuctionDuration: number;
  minBidIncrement: number;
  autoExtensionEnabled: boolean;
  defaultExtensionTime: number;
  maxExtensionTime: number;
  bidDecrementEnabled: boolean;
  defaultDecrementValue: number;

  // Commission Settings
  platformCommission: number;
  minimumCommission: number;
  maximumCommission: number;
  paymentProcessingFee: number;

  // User Settings
  userRegistrationEnabled: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  kycVerificationRequired: boolean;
  autoApproveUsers: boolean;
  maxAuctionsPerUser: number;
  maxBidsPerAuction: number;

  // SMS Settings
  smsEnabled: boolean;
  smsProvider: string;
  smsApiKey: string;
  smsTemplates: {
    registration: string;
    loginOtp: string;
    auctionReminder: string;
    auctionStart: string;
    bidPlaced: string;
    auctionWon: string;
    auctionLost: string;
    auctionApproved: string;
    auctionRejected: string;
    accountApproved: string;
    accountBlocked: string;
  };

  // Email Settings
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  emailFrom: string;
  emailTemplates: {
    welcome: string;
    auctionCreated: string;
    bidNotification: string;
    auctionComplete: string;
    passwordReset: string;
  };

  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  twoFactorEnabled: boolean;
  ipWhitelistEnabled: boolean;
  allowedIpRanges: string[];

  // System Settings
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: string;
  backupEnabled: boolean;
  backupFrequency: string;
  dataRetentionDays: number;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'auction' | 'commission' | 'users' | 'sms' | 'email' | 'security' | 'system'>('general');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - In real app, this would come from API
  const [config, setConfig] = useState<SystemConfig>({
    // General Settings
    siteName: 'AuctionPlatform Pro',
    siteDescription: 'Professional Auction Management Platform',
    contactEmail: 'admin@auctionplatform.com',
    contactPhone: '+91 9999999999',
    address: 'Mumbai, Maharashtra, India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en',

    // Auction Settings
    defaultAuctionDuration: 240, // minutes
    maxAuctionDuration: 1440,
    minBidIncrement: 1000,
    autoExtensionEnabled: true,
    defaultExtensionTime: 5,
    maxExtensionTime: 15,
    bidDecrementEnabled: true,
    defaultDecrementValue: 5000,

    // Commission Settings
    platformCommission: 5.0,
    minimumCommission: 100,
    maximumCommission: 50000,
    paymentProcessingFee: 2.5,

    // User Settings
    userRegistrationEnabled: true,
    emailVerificationRequired: true,
    phoneVerificationRequired: true,
    kycVerificationRequired: true,
    autoApproveUsers: false,
    maxAuctionsPerUser: 10,
    maxBidsPerAuction: 100,

    // SMS Settings
    smsEnabled: true,
    smsProvider: 'twilio',
    smsApiKey: '****************************',
    smsTemplates: {
      registration: 'Welcome to AuctionPlatform! Your OTP is: {otp}',
      loginOtp: 'Your login OTP is: {otp}. Valid for 5 minutes.',
      auctionReminder: 'Auction "{title}" starts in 30 minutes. Join now!',
      auctionStart: 'Auction "{title}" has started. Place your bids now!',
      bidPlaced: 'Your bid of ₹{amount} has been placed successfully.',
      auctionWon: 'Congratulations! You won auction "{title}" with bid ₹{amount}',
      auctionLost: 'Auction "{title}" ended. You were outbid.',
      auctionApproved: 'Your auction "{title}" has been approved by admin.',
      auctionRejected: 'Your auction "{title}" was rejected. Reason: {reason}',
      accountApproved: 'Your account has been approved. You can now participate in auctions.',
      accountBlocked: 'Your account has been blocked. Contact support for details.'
    },

    // Email Settings
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'admin@auctionplatform.com',
    smtpPassword: '****************************',
    emailFrom: 'AuctionPlatform <noreply@auctionplatform.com>',
    emailTemplates: {
      welcome: 'Welcome to AuctionPlatform! Your account has been created successfully.',
      auctionCreated: 'Your auction "{title}" has been created and is pending approval.',
      bidNotification: 'New bid placed on your auction "{title}" for ₹{amount}',
      auctionComplete: 'Your auction "{title}" has completed. Final price: ₹{amount}',
      passwordReset: 'Click here to reset your password: {link}'
    },

    // Security Settings
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    twoFactorEnabled: false,
    ipWhitelistEnabled: false,
    allowedIpRanges: ['192.168.1.0/24', '10.0.0.0/8'],

    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    backupEnabled: true,
    backupFrequency: 'daily',
    dataRetentionDays: 365
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In real app, this would make an API call to save settings
      console.log('Saving settings:', config);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings!');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateSmsTemplate = (templateKey: keyof SystemConfig['smsTemplates'], value: string) => {
    setConfig(prev => ({
      ...prev,
      smsTemplates: {
        ...prev.smsTemplates,
        [templateKey]: value
      }
    }));
  };

  const updateEmailTemplate = (templateKey: keyof SystemConfig['emailTemplates'], value: string) => {
    setConfig(prev => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [templateKey]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}


      {/*Navigation Tabs */}
      {/* <div className="admin-card">
        <div className="admin-card-body">
          <div className="flex flex-wrap gap-2">
            {/* <button
              onClick={() => setActiveTab('general')}
              className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Globe className="w-4 h-4 mr-2" />
              General
            </button> */}
      {/*  <button
              onClick={() => setActiveTab('auction')}
              className={`btn ${activeTab === 'auction' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Auction
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`btn ${activeTab === 'commission' ? 'btn-primary' : 'btn-outline'}`}
            >
              <IndianRupee className="w-4 h-4 mr-2" />
              Commission
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`btn ${activeTab === 'sms' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              SMS
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Database className="w-4 h-4 mr-2" />
              System
            </button>
          </div>
        </div>
      </div>*/}

      {/* General Settings */}
      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-[#111827] rounded-xl shadow-md border border-gray-700 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Site Name */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.siteName}
                onChange={(e) => updateConfig('siteName', e.target.value)}
              />
            </div>

            {/* Contact Email */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.contactEmail}
                onChange={(e) => updateConfig('contactEmail', e.target.value)}
              />
            </div>

            {/* Contact Phone */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.contactPhone}
                onChange={(e) => updateConfig('contactPhone', e.target.value)}
              />
            </div>

            {/* Timezone */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
              <input
                type="text"
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-gray-400 cursor-not-allowed"
                value={config.timezone}
              />
            </div>

            {/* Currency */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
                value={config.currency}
                onChange={(e) => updateConfig('currency', e.target.value)}
              >
                <option className="bg-gray-900 text-white" value="INR">INR (₹)</option>
                <option className="bg-gray-900 text-white" value="USD">USD ($)</option>
              </select>
            </div>

            {/* Language */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <p className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white">
                English
              </p>
            </div>



            {/* Site Description */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.siteDescription}
                onChange={(e) => updateConfig('siteDescription', e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.address}
                onChange={(e) => updateConfig('address', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Settings
        </button>
      </div>

      {/* Auction Settings 
      {activeTab === 'auction' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Auction Settings</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Default Auction Duration (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={config.defaultAuctionDuration}
                  onChange={(e) => updateConfig('defaultAuctionDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Maximum Auction Duration (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={config.maxAuctionDuration}
                  onChange={(e) => updateConfig('maxAuctionDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Minimum Bid Increment (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={config.minBidIncrement}
                  onChange={(e) => updateConfig('minBidIncrement', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Default Decremental Value (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={config.defaultDecrementValue}
                  onChange={(e) => updateConfig('defaultDecrementValue', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Default Extension Time (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={config.defaultExtensionTime}
                  onChange={(e) => updateConfig('defaultExtensionTime', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Maximum Extension Time (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={config.maxExtensionTime}
                  onChange={(e) => updateConfig('maxExtensionTime', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoExtension"
                  checked={config.autoExtensionEnabled}
                  onChange={(e) => updateConfig('autoExtensionEnabled', e.target.checked)}
                />
                <label htmlFor="autoExtension" className="text-sm font-medium text-text-secondary">
                  Enable Auto Extension
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bidDecrement"
                  checked={config.bidDecrementEnabled}
                  onChange={(e) => updateConfig('bidDecrementEnabled', e.target.checked)}
                />
                <label htmlFor="bidDecrement" className="text-sm font-medium text-text-secondary">
                  Enable Bid Decrement
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* Commission Settings 
      {activeTab === 'commission' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Commission Settings</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Platform Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={config.platformCommission}
                  onChange={(e) => updateConfig('platformCommission', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Payment Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={config.paymentProcessingFee}
                  onChange={(e) => updateConfig('paymentProcessingFee', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Minimum Commission (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={config.minimumCommission}
                  onChange={(e) => updateConfig('minimumCommission', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Maximum Commission (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={config.maximumCommission}
                  onChange={(e) => updateConfig('maximumCommission', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* User Settings 
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">User Settings</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Max Auctions per User</label>
                <input
                  type="number"
                  className="input"
                  value={config.maxAuctionsPerUser}
                  onChange={(e) => updateConfig('maxAuctionsPerUser', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Max Bids per Auction</label>
                <input
                  type="number"
                  className="input"
                  value={config.maxBidsPerAuction}
                  onChange={(e) => updateConfig('maxBidsPerAuction', parseInt(e.target.value))}
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="userRegistration"
                    checked={config.userRegistrationEnabled}
                    onChange={(e) => updateConfig('userRegistrationEnabled', e.target.checked)}
                  />
                  <label htmlFor="userRegistration" className="text-sm font-medium text-text-secondary">
                    Enable User Registration
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailVerification"
                    checked={config.emailVerificationRequired}
                    onChange={(e) => updateConfig('emailVerificationRequired', e.target.checked)}
                  />
                  <label htmlFor="emailVerification" className="text-sm font-medium text-text-secondary">
                    Require Email Verification
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="phoneVerification"
                    checked={config.phoneVerificationRequired}
                    onChange={(e) => updateConfig('phoneVerificationRequired', e.target.checked)}
                  />
                  <label htmlFor="phoneVerification" className="text-sm font-medium text-text-secondary">
                    Require Phone Verification
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="kycVerification"
                    checked={config.kycVerificationRequired}
                    onChange={(e) => updateConfig('kycVerificationRequired', e.target.checked)}
                  />
                  <label htmlFor="kycVerification" className="text-sm font-medium text-text-secondary">
                    Require KYC Verification
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoApprove"
                    checked={config.autoApproveUsers}
                    onChange={(e) => updateConfig('autoApproveUsers', e.target.checked)}
                  />
                  <label htmlFor="autoApprove" className="text-sm font-medium text-text-secondary">
                    Auto-approve New Users
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* SMS Settings 
      {activeTab === 'sms' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">SMS Configuration</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smsEnabled"
                    checked={config.smsEnabled}
                    onChange={(e) => updateConfig('smsEnabled', e.target.checked)}
                  />
                  <label htmlFor="smsEnabled" className="text-sm font-medium text-text-secondary">
                    Enable SMS Notifications
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SMS Provider</label>
                  <select
                    className="input"
                    value={config.smsProvider}
                    onChange={(e) => updateConfig('smsProvider', e.target.value)}
                  >
                    <option value="twilio">Twilio</option>
                    <option value="aws-sns">AWS SNS</option>
                    <option value="textlocal">TextLocal</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">API Key</label>
                  <input
                    type="password"
                    className="input"
                    value={config.smsApiKey}
                    onChange={(e) => updateConfig('smsApiKey', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">SMS Templates</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {Object.entries(config.smsTemplates).map(([key, template]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text-secondary mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <textarea
                      className="input"
                      rows={2}
                      value={template}
                      onChange={(e) => updateSmsTemplate(key as keyof SystemConfig['smsTemplates'], e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* Email Settings 
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Email Configuration</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={config.emailEnabled}
                    onChange={(e) => updateConfig('emailEnabled', e.target.checked)}
                  />
                  <label htmlFor="emailEnabled" className="text-sm font-medium text-text-secondary">
                    Enable Email Notifications
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SMTP Host</label>
                  <input
                    type="text"
                    className="input"
                    value={config.smtpHost}
                    onChange={(e) => updateConfig('smtpHost', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SMTP Port</label>
                  <input
                    type="number"
                    className="input"
                    value={config.smtpPort}
                    onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SMTP Username</label>
                  <input
                    type="text"
                    className="input"
                    value={config.smtpUsername}
                    onChange={(e) => updateConfig('smtpUsername', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">SMTP Password</label>
                  <input
                    type="password"
                    className="input"
                    value={config.smtpPassword}
                    onChange={(e) => updateConfig('smtpPassword', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">From Email</label>
                  <input
                    type="email"
                    className="input"
                    value={config.emailFrom}
                    onChange={(e) => updateConfig('emailFrom', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* Security Settings 
      {activeTab === 'security' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Security Settings</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={config.sessionTimeout}
                  onChange={(e) => updateConfig('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  className="input"
                  value={config.maxLoginAttempts}
                  onChange={(e) => updateConfig('maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Password Minimum Length</label>
                <input
                  type="number"
                  className="input"
                  value={config.passwordMinLength}
                  onChange={(e) => updateConfig('passwordMinLength', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="specialChars"
                    checked={config.passwordRequireSpecialChars}
                    onChange={(e) => updateConfig('passwordRequireSpecialChars', e.target.checked)}
                  />
                  <label htmlFor="specialChars" className="text-sm font-medium text-text-secondary">
                    Require Special Characters in Password
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={config.twoFactorEnabled}
                    onChange={(e) => updateConfig('twoFactorEnabled', e.target.checked)}
                  />
                  <label htmlFor="twoFactor" className="text-sm font-medium text-text-secondary">
                    Enable Two-Factor Authentication
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ipWhitelist"
                    checked={config.ipWhitelistEnabled}
                    onChange={(e) => updateConfig('ipWhitelistEnabled', e.target.checked)}
                  />
                  <label htmlFor="ipWhitelist" className="text-sm font-medium text-text-secondary">
                    Enable IP Whitelisting
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
*/}
      {/* System Settings 
      {activeTab === 'system' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">System Settings</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Log Level</label>
                <select
                  className="input"
                  value={config.logLevel}
                  onChange={(e) => updateConfig('logLevel', e.target.value)}
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Backup Frequency</label>
                <select
                  className="input"
                  value={config.backupFrequency}
                  onChange={(e) => updateConfig('backupFrequency', e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Data Retention (days)</label>
                <input
                  type="number"
                  className="input"
                  value={config.dataRetentionDays}
                  onChange={(e) => updateConfig('dataRetentionDays', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={config.maintenanceMode}
                    onChange={(e) => updateConfig('maintenanceMode', e.target.checked)}
                  />
                  <label htmlFor="maintenance" className="text-sm font-medium text-text-secondary">
                    Maintenance Mode
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="debug"
                    checked={config.debugMode}
                    onChange={(e) => updateConfig('debugMode', e.target.checked)}
                  />
                  <label htmlFor="debug" className="text-sm font-medium text-text-secondary">
                    Debug Mode
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="backup"
                    checked={config.backupEnabled}
                    onChange={(e) => updateConfig('backupEnabled', e.target.checked)}
                  />
                  <label htmlFor="backup" className="text-sm font-medium text-text-secondary">
                    Enable Automatic Backups
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}*/}
    </div>
  );
};

export default SystemSettings;
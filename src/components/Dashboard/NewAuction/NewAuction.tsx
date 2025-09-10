import React, { useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Calendar, Clock, Users, FileText, Upload, Plus, Trash2, Save, Send, DollarSign, IndianRupee, ArrowDown } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuctionService from '../../../services/newAuctionService';
import './NewAuction.css';
import { CreateAuctionRequest } from '../../../types/auction';

interface Participant {
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  contactNumber: string;
  _quick?: boolean; // internal flag for quick-added by phone
}

interface AuctionForm {
  title: string;
  auctionDate: string;
  auctionStartTime: string;
  duration: number;
  openToAllCompanies: boolean;
  currency: 'INR' | 'USD';
  auctionDetails: string;
  decrementalValue?: number;
  participants: Participant[];
}

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;
const MAX_FILES = 3;
const MAX_FILE_MB = 15;

const NewAuction: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultTomorrowISO = useMemo(
    () => format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    []
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: rhfSubmitting },
    reset
  } = useForm<AuctionForm>({
    defaultValues: {
      title: '',
      auctionDate: defaultTomorrowISO,
      auctionStartTime: '12:00',
      duration: 120,
      openToAllCompanies: true,
      currency: 'INR',
      auctionDetails: '',
      participants: []
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants'
  });

  const [newParticipantPhone, setNewParticipantPhone] = useState('');

  const watchOpenToAll = watch('openToAllCompanies');

  const normalizedPhone = (raw: string) => {
    const trimmed = raw.trim();
    const noLeadingZeros = trimmed.startsWith('0') ? trimmed.replace(/^0+/, '') : trimmed;
    let candidate = noLeadingZeros.startsWith('+') ? noLeadingZeros : noLeadingZeros;
    if (!candidate.startsWith('+91')) {
      // if plain 10-digit indian number, prefix
      if (/^[6-9]\d{9}$/.test(candidate)) candidate = `+91${candidate}`;
    }
    return candidate;
  };

  const isDuplicateFile = (a: File, b: File) =>
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Size check + dedupe vs existing
    const tooBig = files.find(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" exceeds ${MAX_FILE_MB} MB limit`);
      return;
    }

    const dedupedNew = files.filter(
      f => !uploadedFiles.some(e => isDuplicateFile(e, f))
    );

    if (uploadedFiles.length + dedupedNew.length > MAX_FILES) {
      const allowed = MAX_FILES - uploadedFiles.length;
      if (allowed <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      dedupedNew.splice(allowed);
      toast('Some files skipped to keep within limit', { icon: 'ℹ️' });
    }

    if (dedupedNew.length === 0) {
      toast('No new files added (duplicates skipped)', { icon: 'ℹ️' });
    } else {
      setUploadedFiles(prev => [...prev, ...dedupedNew]);
      toast.success(`${dedupedNew.length} file(s) uploaded`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const addParticipant = () => {
    append({
      companyName: '',
      companyAddress: '',
      personName: '',
      mailId: '',
      contactNumber: ''
    });
  };

  const addParticipantByPhone = () => {
    const normalized = normalizedPhone(newParticipantPhone);
    if (!PHONE_REGEX.test(normalized)) {
      toast.error('Enter valid Indian number (+91XXXXXXXXXX or 9/8/7/6XXXXXXXXX)');
      return;
    }
    const exists = fields.some(
      f =>
        f.contactNumber === normalized ||
        normalizedPhone(f.contactNumber) === normalized
    );
    if (exists) {
      toast.error('Phone already added');
      return;
    }
    append({
      companyName: '',
      companyAddress: '',
      personName: '',
      mailId: '',
      contactNumber: normalized,
      _quick: true
    });
    toast.success('Added');
    setNewParticipantPhone('');
  };

  const onSubmit = async (data: AuctionForm) => {
    if (isSubmitting || rhfSubmitting) return;

    if (!user) {
      toast.error('Please log in to create an auction');
      navigate('/login');
      return;
    }

    if (!AuctionService.isAuthenticated()) {
      toast.error('Your session has expired. Please log in again.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!data.openToAllCompanies && data.participants.length === 0) {
        toast.error('Please add at least one participant or set auction as "Open to all companies"');
        setIsSubmitting(false);
        return;
      }

      // Normalize + dedupe participants (by phone)
      const normalizedUniquePhones = Array.from(
        new Set(
          data.participants
            .map(p => normalizedPhone(p.contactNumber))
            .filter(p => PHONE_REGEX.test(p))
        )
      );

      // Normalize time + duration for backend (expects HH:mm:ss and seconds)
      const startTime = data.auctionStartTime && data.auctionStartTime.length === 5
        ? `${data.auctionStartTime}:00`
        : data.auctionStartTime;
      const durationSeconds = (data.duration || 0) * 60; // UI is minutes -> API expects seconds

      const auctionPayload: CreateAuctionRequest = {
        title: data.title.trim(),
        description: data.auctionDetails.trim(),
        auction_date: data.auctionDate,
        start_time: startTime,
        duration: durationSeconds,
        currency: data.currency,
        base_price: 0,
        decremental_value: data.decrementalValue ?? 0,
        pre_bid_allowed: true,
        send_invitations: !data.openToAllCompanies,
        participants: normalizedUniquePhones
      };

      const response = await AuctionService.createAuction(auctionPayload, uploadedFiles);

      if (!response.success || !response.auction) {
        throw new Error(response.message || 'Failed to create auction');
      }

      const auctionId = response.auction.id;
      let successMessage = `Auction "${response.auction.title}" created successfully!`;
      // Prefer new API shape invitationResults; fallback to legacy smsResults if present
      const inv = (response as any).invitationResults;
      if (inv) {
        const successfulSMS = inv.successfulSMS || 0;
        const successfulWhatsApp = inv.successfulWhatsApp || 0;
        const failed = Array.isArray(inv.failures) ? inv.failures.length : 0;
        const total = inv.totalParticipants ?? (successfulSMS + successfulWhatsApp + failed);
        successMessage += ` ${successfulSMS} SMS sent${successfulWhatsApp ? `, ${successfulWhatsApp} WhatsApp sent` : ''}.`;
        if (failed > 0) successMessage += ` ${failed} invitation(s) failed.`;
        if (typeof total === 'number') successMessage += ` (${total} participant${total === 1 ? '' : 's'} processed)`;
      } else if ((response as any).smsResults) {
        const { successfulSMS = 0, failedSMS = 0 } = (response as any).smsResults;
        if (successfulSMS > 0) successMessage += ` ${successfulSMS} invitation(s) sent.`;
        if (failedSMS > 0) successMessage += ` ${failedSMS} invitation(s) failed.`;
      }

      toast.success(successMessage, { duration: 4000 });

      // Reset form safely (keep tomorrow/date defaults the same after reset)
      reset({
        title: '',
        auctionDate: defaultTomorrowISO,
        auctionStartTime: '12:00',
        duration: 120,
        openToAllCompanies: true,
        currency: 'INR',
        auctionDetails: '',
        participants: []
      });
      setUploadedFiles([]);

      setTimeout(() => {
        navigate(`/dashboard/auction/${auctionId}`);
      }, 1200);
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Failed to create auction. Please try again.';
      if (/Authentication|session/i.test(msg)) {
        toast.error(`${msg} Redirecting to login...`);
        AuctionService.clearAuth();
        setTimeout(() => navigate('/login'), 1400);
      } else if (/Network/i.test(msg)) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (/Server/i.test(msg)) {
        toast.error('Server error. Please try again in a few moments.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ap-newauction-wrapper">
      {/* Header Section */}
      <div className="ap-newauction-container">
        <div className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              Create New Auction
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-white text-sm font-medium shadow-sm">
              <Users className="w-4 h-4" />
              Auctioneer
            </span>
          </div>
          <div className="card-body">
            <p className="text-text-secondary text-sm">
              Set up a new auction with participants and terms
            </p>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="ap-newauction-container">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">Basic Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-6">
                {/* Auction Title */}
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Auction Title <span className="required">*</span>
                  </label>

                  <input
                    type="text"
                    id="title"
                    className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="Enter Auction Title (e.g., Steel Pipes and Fittings Procurement)"
                    {...register('title', {
                      required: 'Auction title is required',
                      minLength: {
                        value: 5,
                        message: 'Auction title must be at least 5 characters'
                      }
                    })}
                  />
                  {errors.title && (
                    <p className="error-message">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Auction Date */}
                <div className="form-group">
                  <label htmlFor="auctionDate" className="form-label">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Auction Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="auctionDate"
                    className={`form-input ${errors.auctionDate ? 'error' : ''}`}
                    min={defaultTomorrowISO}
                    {...register('auctionDate', {
                      required: 'Auction date is required',
                      validate: (value) => {
                        if (!value) return 'Auction date is required';
                        const tomorrowISO = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                        return value >= tomorrowISO || 'Auction date must be tomorrow or later';
                      }
                    })}
                  />
                  {errors.auctionDate && (
                    <div className="form-error">{errors.auctionDate.message}</div>
                  )}
                  <div className="text-sm text-text-secondary mt-1">
                    Default: Tomorrow ({format(addDays(new Date(), 1), "dd/MM/yyyy")})
                  </div>

                </div>

                {/* Auction Start Time */}
                <div className="form-group">
                  <label htmlFor="auctionStartTime" className="form-label">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Auction Start Time <span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    id="auctionStartTime"
                    className={`form-input ${errors.auctionStartTime ? 'error' : ''}`}
                    {...register('auctionStartTime', {
                      required: 'Start time is required'
                    })}
                  />
                  {errors.auctionStartTime && (
                    <div className="form-error">{errors.auctionStartTime.message}</div>
                  )}
                  <div className="text-sm text-text-secondary mt-1">
                    Default: 12:00 PM Delhi time
                  </div>
                </div>

                {/* Duration */}
                <div className="form-group">
                  <label htmlFor="duration" className="form-label">
                    <Clock className="w-4 h-4 inline mr-2" />

                    Duration <span className="required">*</span>
                  </label>
                  <select
                    id="duration"
                    className={`form-input ${errors.duration ? 'error' : ''}`}
                    {...register('duration', {
                      required: 'Duration is required',
                      valueAsNumber: true
                    })}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                  </select>
                  {errors.duration && (
                    <div className="form-error">{errors.duration.message}</div>
                  )}
                  <div className="text-sm text-text-secondary mt-1">
                    Default: 2 Hours
                  </div>
                </div>

                {/* Currency */}
                <div className="form-group">
                  <label htmlFor="currency" className="form-label">
                    <IndianRupee className="w-4 h-4 inline mr-2" />

                    Currency <span className="required">*</span>
                  </label>
                  <select
                    id="currency"
                    className={`form-input ${errors.currency ? 'error' : ''}`}
                    {...register('currency', {
                      required: 'Currency is required'
                    })}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                  {errors.currency && (
                    <div className="form-error">{errors.currency.message}</div>
                  )}
                  <div className="text-sm text-text-secondary mt-1">
                    Default: INR
                  </div>
                </div>
              </div>

              {/* Open to All Companies */}
              <div className="form-group">
                <label className="flex items-start gap-3 flex-wrap">

                  <span className="form-label">
                    Open to all companies (Suppliers)
                  </span>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    {...register('openToAllCompanies')}
                  />
                </label>
                <div className="form-helper-text">
                  {watchOpenToAll
                    ? '✓ Auction details will be visible to every participant'
                    : '⚠️ Only invited participants can view and join this auction'
                  }
                </div>
              </div>

            </div>
          </div>

          {/* Product Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">Product Details</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="auctionDetails" className="form-label">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Product Details / Description <span className="required">*</span>
                </label>
                <textarea
                  id="auctionDetails"
                  rows={4}
                  className={`form-input ${errors.auctionDetails ? 'error' : ''}`}
                  placeholder="Enter Detailed Description of Products/Services to Be Auctioned"

                  {...register('auctionDetails', {
                    required: 'Product details are required',
                    minLength: {
                      value: 10,
                      message: 'Please provide detailed product information (minimum 10 characters)'
                    }
                  })}
                />
                {errors.auctionDetails && (
                  <div className="form-error">{errors.auctionDetails.message}</div>
                )}
              </div>

              {/* Pre-Bid Offer note (implicit) */}
              <div className="form-group">
                <div className="text-sm text-text-secondary">
                  ✓ Participants can submit pre-bid offers before auction starts (pre-bid enabled by default)
                </div>
              </div>

              {/* Decremental Value */}
              <div className="form-group">
                <label htmlFor="decrementalValue" className="form-label">
                  <ArrowDown className="w-4 h-4 inline mr-2" />

                  Decremental Value (Optional)
                </label>
                <input
                  type="number"
                  id="decrementalValue"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="Enter minimum bid reduction amount"
                  {...register('decrementalValue', {
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: 'Decremental value must be at least 1'
                    }
                  })}
                />
                {errors.decrementalValue && (
                  <div className="form-error">{errors.decrementalValue.message}</div>
                )}
                <div className="text-sm text-text-secondary mt-1">
                  Minimum amount by which each bid must be lower than the current lowest bid
                </div>
              </div>
            </div>
          </div>

          {/* Auction Documents */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">Auction Documents</h2>
              <p className="text-text-secondary">Upload supporting documents (Optional, max 3 files)</p>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="documents" className="form-label">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Documents
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="documents"
                  multiple
                  accept="*/*"
                  className="form-input"
                  onChange={handleFileUpload}
                  disabled={uploadedFiles.length >= MAX_FILES}
                />
                <div className="text-sm text-text-secondary mt-1">
                  Upload max {MAX_FILES} files of any type (PDF, DOC, XLS, images, etc.) • up to {MAX_FILE_MB} MB each
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Uploaded Files:</h4>
                  {uploadedFiles.length > 0 &&
                    uploadedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className="ap-newauction-file-item"
                      >
                        <div className="file-info">
                          <FileText className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="file-remove-btn"
                        >
                          <Trash2 className="file-icon" />
                        </button>
                      </div>
                    ))}
                </div>

              )}
            </div>
          </div>

          {/* Add Participants */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Add Participants</h2>
                  <p className="text-text-secondary" style={{ marginTop: "15px", marginBottom: "15px" }}>
                    Add unlimited participants (Phone number is primary identifier).
                    {watchOpenToAll ? ' Note: auction is open to all companies; invitations are optional.' : ' Only invited participants will be able to view and join.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newParticipantPhone}
                    onChange={(e) => setNewParticipantPhone(e.target.value)}
                    className="form-input text-center"
                    aria-label="Participant phone number"
                  />

                  <button
                    type="button"
                    onClick={addParticipantByPhone}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Add by Phone
                  </button>
                  {/* <button
                      type="button"
                      onClick={addParticipant}
                      className="btn btn-secondary"
                      title="Add full participant form"
                    >
                      <Plus className="w-4 h-4" />
                      Add Participant
                    </button> */}
                </div>
              </div>
            </div>
            <div className="card-body">
              {fields.length === 0 ? (
                <div className="ap-newauction-empty-state">
                  <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    No participants added yet. Click "Add by Phone" to invite users.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className={`ap-newauction-participant-card ${field._quick ? 'quick-participant' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-text-primary">
                          Participant {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Company Name (hidden for quick add) */}
                        {!field._quick && (
                          <div className="form-group">
                            <label className="form-label">Company Name *</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter company name"
                              {...register(`participants.${index}.companyName`, {
                                required: 'Company name is required'
                              })}
                            />
                            {errors.participants?.[index]?.companyName && (
                              <div className="form-error">
                                {errors.participants[index]?.companyName?.message}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Contact Number *</label>
                          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                            <input
                              type="tel"
                              className="form-input flex-1 min-w-0"
                              placeholder="Enter phone number"
                              {...register(`participants.${index}.contactNumber`, {
                                required: 'Contact number is required',
                                pattern: {
                                  value: PHONE_REGEX,
                                  message: 'Please enter a valid Indian phone number'
                                },
                                setValueAs: (v: string) => normalizedPhone(v)
                              })}
                            />
                            {field.contactNumber && (
                              <button
                                type="button"
                                className="btn btn-primary whitespace-nowrap flex-shrink-0 px-3 py-2 text-base"
                                style={{ minWidth: '120px' }}
                                onClick={() => toast.success(`Invitation sent to ${field.contactNumber}`)}
                              >
                                <span className="flex items-center justify-center">
                                  <Send className="w-4 h-4 inline mr-1" />
                                  <span className="inline-block">Invitation</span>
                                </span>
                              </button>
                            )}
                          </div>
                          {errors.participants?.[index]?.contactNumber && (
                            <div className="form-error">
                              {errors.participants[index]?.contactNumber?.message}
                            </div>
                          )}
                        </div>

                        {!field._quick && (
                          <div className="form-group">
                            <label className="form-label">Person Name</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter contact person name"
                              {...register(`participants.${index}.personName`)}
                            />
                          </div>
                        )}

                        {!field._quick && (
                          <div className="form-group">
                            <label className="form-label">Email Id</label>
                            <input
                              type="email"
                              className="form-input"
                              placeholder="Enter email address"
                              {...register(`participants.${index}.mailId`, {
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Please enter a valid email address'
                                }
                              })}
                            />
                            {errors.participants?.[index]?.mailId && (
                              <div className="form-error">
                                {errors.participants[index]?.mailId?.message}
                              </div>
                            )}
                          </div>
                        )}

                        {/* <div className="form-group md:col-span-2">
                          <label className="form-label">Company Address</label>
                          <textarea
                            rows={2}
                            className="form-input"
                            placeholder="Enter company address"
                            {...register(`participants.${index}.companyAddress`)}
                          />
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    reset({
                      title: '',
                      auctionDate: defaultTomorrowISO,
                      auctionStartTime: '12:00',
                      duration: 120,
                      openToAllCompanies: true,
                      currency: 'INR',
                      auctionDetails: '',
                      participants: []
                    });
                    setUploadedFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      Submit & Create Auction
                    </>
                  )}
                </button>
              </div>

              {/* SMS Notification Info */}
              <div className="ap-newauction-sms-notification">
                <div className="flex items-center gap-2 text-sm text-purple-800">
                  <Send className="w-4 h-4" />
                  <span className="font-medium">Auto SMS Type 3:</span>
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  "Please submit Pre Bid on Auction Website to join Auction + Website/App link"
                  <br />
                  (Will be sent to all added participants upon auction creation)
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAuction;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registration.css";
import authService from "../../services/authService";
import toast from "react-hot-toast";

interface RegistrationFormState {
  phone: string;
  email: string;
  name: string;
  companyName: string;
  companyAddress: string;
  otp: string;
}

function Registration() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationFormState>({
    phone: "",
    email: "",
    name: "",
    companyName: "",
    companyAddress: "",
    otp: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;


    switch (name) {
      case 'phone':

        filteredValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      case 'name':
      case 'companyName':

        filteredValue = value.replace(/[^a-zA-Z\s\-\.\,\&\'\(\)]/g, '');
        break;
      case 'email':

        filteredValue = value.replace(/[^a-zA-Z0-9@\.\-\_]/g, '');
        break;
      case 'companyAddress':

        filteredValue = value.replace(/[^a-zA-Z0-9\s\-\.\,\#\/\(\)]/g, '');
        break;
      default:
        filteredValue = value;
    }

    setForm((prev) => ({ ...prev, [name]: filteredValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {

      if (!form.phone.trim()) {
        toast.error("Phone number is required");
        return;
      }
      if (form.phone.length !== 10) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }
      if (!/^\d{10}$/.test(form.phone)) {
        toast.error("Phone number must contain only digits");
        return;
      }


      if (!form.companyName.trim()) {
        toast.error("Company name is required");
        return;
      }
      if (form.companyName.trim().length < 2) {
        toast.error("Company name must be at least 2 characters");
        return;
      }


      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast.error("Please enter a valid email address");
        return;
      }


      if (form.name && form.name.trim().length < 2) {
        toast.error("Name must be at least 2 characters");
        return;
      }


      let formattedPhone = '+91' + form.phone.trim();


      const response = await authService.register({
        phone_number: formattedPhone,
        email: form.email || undefined,
        person_name: form.name || undefined,
        company_name: form.companyName.trim(), // Required field
        company_address: form.companyAddress || undefined,
      });

      if (response.success) {

        if (response.user) {
          localStorage.setItem('auctionUser', JSON.stringify(response.user));
        }
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }

        toast.success(response.message || "Registration completed successfully! Please login to continue.");
        navigate('/login');
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ap-reg-wrapper">
      <div className="ap-reg-card">
        <header
          className="ap-reg-header"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <h1 className="ap-reg-title">Create Your Account</h1>
          <p className="ap-reg-sub">Register to participate in auctions</p>
        </header>

        <form
          className="ap-reg-form"
          onSubmit={handleSave}
          noValidate
        >
          <div className="ap-reg-grid">
            <div className="ap-reg-field">
              <label htmlFor="phone" className="ap-reg-label">
                Phone Number <span className="ap-reg-required">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                required
                inputMode="numeric"
                pattern="\d{10}"
                className="ap-reg-input"
                placeholder='1234567890'
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                title="Enter exactly 10 digits"
              />

              <small className="ap-reg-hint">Enter exactly 10 digits (no spaces or symbols)</small>
            </div>
            <div className="ap-reg-field">
              <label htmlFor="email" className="ap-reg-label">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                className="ap-reg-input"
                placeholder="example@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                title="Enter a valid email address"
              />
            </div>
            <div className="ap-reg-field">
              <label htmlFor="name" className="ap-reg-label">Person Name</label>
              <input
                id="name"
                type="text"
                name="name"
                className="ap-reg-input"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                pattern="[a-zA-Z\s\-\.]{2,50}"
                title="Enter a valid name (letters, spaces, hyphens, dots only)"
                minLength={2}
                maxLength={50}
              />
            </div>
            <div className="ap-reg-field">
              <label htmlFor="companyName" className="ap-reg-label">
                Company Name <span className="ap-reg-required">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                className="ap-reg-input"
                placeholder="ABC Corporation Ltd"
                value={form.companyName}
                onChange={handleChange}
                autoComplete="organization"
                required
                pattern="[a-zA-Z0-9\s\-\.\,\&\'\(\)]{2,100}"
                title="Enter a valid company name (2-100 characters)"
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="ap-reg-field ap-reg-field--full">
              <label htmlFor="companyAddress" className="ap-reg-label">Company Address</label>
              <input
                id="companyAddress"
                type="text"
                name="companyAddress"
                className="ap-reg-input"
                placeholder="123 Business Street, City, State"
                value={form.companyAddress}
                onChange={handleChange}
                autoComplete="street-address"
                pattern="[a-zA-Z0-9\s\-\.\,\#\/\(\)]{0,200}"
                title="Enter a valid address"
                maxLength={200}
              />
            </div>
          </div>
          <div className="ap-reg-actions">

            <button
              type="submit"
              className="ap-reg-btn"
              disabled={submitting || !form.phone || !form.companyName}
            >
              {submitting ? "Registering..." : "Register"}
            </button><button
              type="button"
              className="ap-reg-btn"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
          <p className="ap-reg-disclaimer">
            By continuing you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Registration;
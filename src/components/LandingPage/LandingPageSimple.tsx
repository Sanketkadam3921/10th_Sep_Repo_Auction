import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import {
  Gavel,
  Users,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  Menu,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Zap
} from 'lucide-react';

// Simple Link component using react-router's useNavigate
const SimpleLink: React.FC<{ to: string; className?: string; children: React.ReactNode; onClick?: () => void }> = ({
  to,
  className,
  children,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }
    navigate(to);
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  const slides = [
    {
      title: "Create Professional Auctions",
      description: "Set up detailed auctions with participant management, document uploads, and automated notifications.",
      image: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=5d6f6a6c6a2b2f3d7e8a9b0c1d2e3f4a',
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Real-time Bidding Experience",
      description: "Live countdown timers, instant bid updates, and automatic auction extensions for fair competition.",
      image: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=7c9b7a3a6a9e4f8b2c3d1e5f6a7b8c9d',
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Dual Role System",
      description: "Switch seamlessly between auctioneer and participant roles with a single account.",
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      gradient: "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)"
    },
    {
      title: "Secure & Reliable",
      description: "OTP-based authentication, secure transactions, and comprehensive audit trails.",
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=6b5d4c3f2a1e0d9c8b7a6f5e4d3c2b1a',
      gradient: "linear-gradient(135deg, #ffecd2 0%, #ff7f54ff 100%)"
    },
    {
      title: "Advanced Analytics",
      description: "Detailed reports, bid summaries, and performance analytics for better decision making.",
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b',
      gradient: "linear-gradient(135deg, #a8edea 0%, #f54c82ff 100%)"
    }
  ];

  const features = [
    {
      icon: <Gavel className="w-8 h-8 text-blue-500" />,
      title: "Buyer Posts Requirements",
      description: "Create listings detailing goods or services needed, with specifications, quantities, and delivery schedules."
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Suppliers Register & Bid",
      description: "Pre-qualified suppliers register and submit initial bids, competing to offer the best price."
    },
    {
      icon: <Clock className="w-8 h-8 text-yellow-500" />,
      title: "Real-Time Bidding",
      description: "Auctions run over a set period with countdown timers and progressive bid updates."
    },
    {
      icon: <Shield className="w-8 h-8 text-indigo-500" />,
      title: "Contract Awarded",
      description: "Once the auction ends, buyers select the lowest or best bid based on price, quality, and reliability."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-pink-500" />,
      title: "Cost Savings",
      description: "Competitive bidding ensures buyers receive the most cost-effective options."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-teal-500" />,
      title: "Transparency & Efficiency",
      description: "Streamlined processes with open bidding provide transparency and reduce negotiation time."
    }
  ];

  const steps = [
    { step: "1", title: "Post Requirements", description: "Submit detailed specifications for goods or services needed." },
    { step: "2", title: "Supplier Registration", description: "Invite suppliers to register and submit initial bids." },
    { step: "3", title: "Real-Time Bidding", description: "Suppliers compete in real-time to offer the best prices." },
    { step: "4", title: "Contract Award", description: "Evaluate bids and award contract to the lowest or most suitable bidder." }
  ];

  const stats = [
    { number: "1000+", label: "Successful Auctions" },
    { number: "500+", label: "Active Users" },
    { number: "₹10M+", label: "Transaction Value" },
    { number: "99.9%", label: "Uptime" }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      setIsNavScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`landing-nav ${isNavScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <Gavel className="w-6 h-6" />
            </div>
            <span className="nav-logo-text">Quickauction</span>
          </div>

          <ul className="nav-menu">
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a></li>
            <li><a href="#stats" onClick={(e) => { e.preventDefault(); scrollToSection('stats'); }}>Stats</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          </ul>

          <SimpleLink to="/login" className="nav-cta">
            Get Started
          </SimpleLink>

          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-floating"><Gavel className="w-6 h-6" /></div>
        <div className="hero-floating"><TrendingUp className="w-6 h-6" /></div>
        <div className="hero-floating"><Zap className="w-6 h-6" /></div>

        <div className="container">
          <div className="hero-content loading-fade-in">
            <h1 className="hero-title">
              Professional Auction Platform
            </h1>
            <p className="hero-subtitle">
              Create, manage and participate in auctions with our comprehensive platform.
              Features real-time bidding, automated notifications and detailed reporting.
            </p>
            <div className="hero-buttons">
              <SimpleLink to="/login" className="cta-button">
                Start Auctioning →
              </SimpleLink>
              <button
                className="cta-button"
                onClick={() => scrollToSection('features')}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Slider */}
      <section className="container">
        <div className="slider-container">
          <div
            className="slider-wrapper"
            style={{ transform: `translateX(-${currentSlide * 20}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className="slider-slide"
                style={{ background: slide.gradient }}
              >
                {slide.image && (
                  <div className="slider-image-wrap">
                    <img className="slider-image" src={slide.image} alt={slide.title} />
                  </div>
                )}
                <div className="slider-content">
                  <h3 className="slider-title">{slide.title}</h3>
                  <p className="slider-description">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="slider-arrow prev" onClick={prevSlide} aria-label="Previous slide">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="slider-arrow next" onClick={nextSlide} aria-label="Next slide">
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="slider-nav">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="text-center loading-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Successful Auctions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools and features needed to conduct professional auctions
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card loading-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="text-center loading-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with our platform in just a few simple steps
            </p>
          </div>

          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={index} className="step-card loading-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="step-number">
                  {step.step}
                </div>
                <h3 className={`step-title ${['Register with Phone', 'Create or Join', 'Start Bidding', 'Track Results'].includes(step.title) ? 'how-step-highlight' : ''}`}>
                  {step.title}
                </h3>
                <p className="step-description">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card loading-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content loading-fade-in">
            <h2 className="cta-title">
              Ready to Start Your Auction Journey?
            </h2>
            <p className="cta-description">
              Join thousands of users who trust our platform for their auction needs.
              Create your account today and experience the future of digital auctions.
            </p>
            <SimpleLink to="/login" className="cta-button">
              Get Started Now
              <span>→</span>
            </SimpleLink>
          </div>
        </div>
      </section>
      <section
        id="terms"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          maxWidth: "900px",
          margin: "4rem auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "1rem",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Terms and Conditions
        </h1>

        <h4
          style={{
            fontWeight: "500",
            marginBottom: "1rem",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Welcome to Our E-Auction Platform
        </h4>

        <p
          style={{
            textAlign: "justify",
            margin: "1rem 0",
            lineHeight: "1.75rem",
            color: "#4a5568",
          }}
        >
          These Terms govern your use of our platform, services, and applications.
          By using this website, you agree to comply with all the Terms & Conditions outlined here,
          as well as any additional rules set by Auctioners for specific auctions.
        </p>

        {/* Section 1 */}
        <div style={{ width: "100%", marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#000000" }}>
            Our Services
          </h4>
          <p style={{ textAlign: "justify", color: "#4a5568" }}>
            This is a professional e-auction platform for Auctioners and Participants. Auctioners are responsible for defining Terms & Conditions for each auction.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ width: "100%", marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#000000" }}>
            Participant Responsibilities
          </h4>
          <p style={{ textAlign: "justify", color: "#4a5568" }}>
            Every participant must adhere to the Terms & Conditions set by the Auctioner for each auction. Failure to comply may result in disqualification or removal from the auction.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ width: "100%", marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#000000" }}>
            Website Liability
          </h4>
          <p style={{ textAlign: "justify", color: "#4a5568" }}>
            The website holds no liability for disputes between participants and auctioners. However, support will be provided to assist in resolving any conflicts.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ width: "100%", marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#000000" }}>
            Modifications
          </h4>
          <p style={{ textAlign: "justify", color: "#4a5568" }}>
            The website management reserves the right to modify the Terms & Conditions at any time without prior notice.
          </p>
        </div>

      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <Gavel className="w-6 h-6" />
                </div>
                <span className="footer-logo-text">Quickauction</span>
              </div>
              <p>
                Professional auction platform for modern businesses.
                Streamline your auction process with our comprehensive tools and features.
              </p>
            </div>

            <div className="footer-section">
              <h3>Platform</h3>
              <ul>
                <li><a href="#features">Create Auction</a></li>
                <li><a href="#features">Join Auction</a></li>
                <li><a href="#features">Reports & Analytics</a></li>
                <li><a href="#features">Admin Panel</a></li>
                <li><a href="#features">API Documentation</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                <li><a href="#contact">Help Center</a></li>
                <li><a href="#contact">Contact Support</a></li>
                <li><a href="#contact">Documentation</a></li>
                <li><a href="#contact">Terms of Service</a></li>
                <li><a href="#contact">Privacy Policy</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Contact Information</h3>
              <ul>
                <li>
                  <Mail className="w-4 h-4 inline-block mr-2" /> support@quickauction.com
                </li>
                <li>
                  <Phone className="w-4 h-4 inline-block mr-2" /> +91 9876543210
                </li>
                <li>
                  <MapPin className="w-4 h-4 inline-block mr-2" /> Mumbai, Maharashtra, India
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 Quickauction. All rights reserved. Built with for modern auctions.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default LandingPage;
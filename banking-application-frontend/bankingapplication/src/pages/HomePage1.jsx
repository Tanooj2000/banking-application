import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiTrendingUp, FiCreditCard, FiUsers, FiStar, FiArrowRight, FiCheck } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import bankingImage from '../assets/banking-Image.avif';
import './HomePage1.css';

const HomePage1 = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentBankSlide, setCurrentBankSlide] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  const slides = [
    {
      id: 1,
      title: "Digital Banking Revolution",
      description: "Experience seamless banking with our cutting-edge digital platform. Manage all your accounts, transfers, and investments from anywhere.",
      image: bankingImage,
      features: ["24/7 Online Banking", "Instant Transfers", "Mobile App", "Secure Authentication"]
    },
    {
      id: 2,
      title: "Investment Solutions",
      description: "Grow your wealth with our comprehensive investment portfolio management and expert financial advisory services.",
      image: bankingImage,
      features: ["Portfolio Management", "Stock Trading", "Mutual Funds", "Financial Planning"]
    },
    {
      id: 3,
      title: "Business Banking",
      description: "Streamline your business finances with our corporate banking solutions designed for modern enterprises.",
      image: bankingImage,
      features: ["Corporate Accounts", "Payroll Services", "Business Loans", "Cash Management"]
    },
    {
      id: 4,
      title: "Security & Protection",
      description: "Your financial security is our priority with advanced fraud detection and military-grade encryption.",
      image: bankingImage,
      features: ["Fraud Protection", "Identity Monitoring", "Secure Transactions", "Insurance Coverage"]
    }
  ];

  const featuresSlides = [
    {
      id: 1,
      title: "Digital Banking Revolution",
      description: "Experience seamless banking with our cutting-edge digital platform.",
      image: "/src/assets/bank-1.jpg",
      features: ["24/7 Online Banking", "Instant Transfers", "Mobile App"]
    },
    {
      id: 2,
      title: "Investment Solutions", 
      description: "Grow your wealth with comprehensive investment portfolio management.",
      image: "/src/assets/bank-3.jpg",
      features: ["Portfolio Management", "Stock Trading", "Financial Planning"]
    },
    {
      id: 3,
      title: "Security & Protection",
      description: "Advanced fraud detection and military-grade encryption.",
      image: "/src/assets/bank-4.webp",
      features: ["Fraud Protection", "Identity Monitoring", "Secure Transactions"]
    }
  ];

  const bankSlides = [
    {
      id: 1,
      name: "HDFC Bank",
      description: "India's largest private sector bank offering comprehensive banking services.",
      image: "/src/assets/banks/hdfc-bank.webp",
      services: ["Personal Banking", "Business Banking", "Digital Services"]
    },
    {
      id: 2,
      name: "ICICI Bank",
      description: "Leading private sector bank with innovative digital banking solutions.",
      image: "/src/assets/banks/icici-bank.webp", 
      services: ["Internet Banking", "Mobile Banking", "Investment Services"]
    },
    {
      id: 3,
      name: "State Bank of India",
      description: "India's largest public sector bank with nationwide presence.",
      image: "/src/assets/banks/state-bank-of-india.webp",
      services: ["Rural Banking", "Corporate Banking", "International Banking"]
    },
    {
      id: 4,
      name: "Axis Bank", 
      description: "Modern banking solutions with customer-centric approach.",
      image: "/src/assets/banks/axis-bank.webp",
      services: ["Digital Banking", "Wealth Management", "Credit Solutions"]
    },
    {
      id: 5,
      name: "JPMorgan Chase",
      description: "Global banking leader with comprehensive financial services.",
      image: "/src/assets/banks/jpmorgan-chase.webp",
      services: ["Investment Banking", "Asset Management", "Global Banking"]
    },
    {
      id: 6,
      name: "Wells Fargo",
      description: "Established American bank with diverse financial products.",
      image: "/src/assets/banks/wells-fargo.webp",
      services: ["Personal Banking", "Mortgage Services", "Commercial Banking"]
    }
  ];

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    const type = sessionStorage.getItem('userType');
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');
    const isAdminAuth = type === 'admin' && adminData && loggedOut !== 'true';
    const isUserAuth = type === 'user' && token;
    setIsSignedIn(isAdminAuth || isUserAuth);
    setUserType(isAdminAuth ? 'admin' : isUserAuth ? 'user' : null);

    // Add scroll reveal animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    // Slideshow auto-play
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuresSlides.length);
    }, 5000);

    // Bank slideshow auto-play
    const bankSlideInterval = setInterval(() => {
      setCurrentBankSlide((prev) => (prev + 1) % bankSlides.length);
    }, 4000);

    return () => {
      observer.disconnect();
      clearInterval(slideInterval);
      clearInterval(bankSlideInterval);
    };
  }, [featuresSlides.length, bankSlides.length]);

  const features = [
    {
      icon: FiShield,
      title: 'Bank-Level Security',
      description: 'Military-grade encryption and multi-factor authentication protect your financial data'
    },
    {
      icon: FiTrendingUp,
      title: 'Smart Analytics',
      description: 'AI-powered insights help you make informed financial decisions and track spending'
    },
    {
      icon: FiCreditCard,
      title: 'Digital Payments',
      description: 'Seamless transactions with instant transfers and contactless payment solutions'
    },
    {
      icon: FiUsers,
      title: '24/7 Support',
      description: 'Round-the-clock customer service with real human experts, not chatbots'
    }
  ];

  const stats = [
    { value: '2M+', label: 'Active Users' },
    { value: '$50B+', label: 'Transactions Processed' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '150+', label: 'Countries Served' }
  ];

  const benefits = [
    'Zero monthly fees for standard accounts',
    'Instant money transfers worldwide',
    'Mobile check deposits in seconds',
    'Real-time fraud protection',
    'Investment portfolio management',
    'Cryptocurrency trading platform'
  ];

  const dashboardPath = userType === 'admin' ? '/adminpage' : '/userpage';

  return (
    <div className="homepage1">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={bankingImage} alt="Banking Background" className="hero-bg-image" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Banking Made
                <span className="gradient-text"> Simple</span>
              </h1>
              <p className="hero-subtitle">
                Experience the future of banking with our comprehensive financial platform. 
                Manage your money, investments, and financial goals all in one secure place.
              </p>
              
              <div className="hero-cta">
                {isSignedIn ? (
                  <Link to={dashboardPath} className="cta-primary">
                    <span>Go to Dashboard</span>
                    <FiArrowRight className="cta-icon" />
                  </Link>
                ) : (
                  <div className="cta-group">
                    <Link to="/signup" className="cta-primary">
                      <span>Get Started Free</span>
                      <FiArrowRight className="cta-icon" />
                    </Link>
                    <Link to="/signin" className="cta-secondary">
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              <div className="trust-indicators">
                <div className="trust-item">
                  <FiShield className="trust-icon" />
                  <span>FDIC Insured</span>
                </div>
                <div className="trust-item">
                  <FiStar className="trust-icon" />
                  <span>4.9★ Rating</span>
                </div>
                <div className="trust-item">
                  <FiUsers className="trust-icon" />
                  <span>2M+ Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Slideshow Section */}
      <section className="dual-slideshow-section reveal">
        <div className="container">
          <div className="dual-slideshow-grid">
            
            {/* Features Slideshow */}
            <div className="slideshow-container features-slideshow">
              <div className="slide-content">
                <div 
                  className="slides-wrapper" 
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuresSlides.map((slide, index) => (
                    <div key={slide.id} className="slide compact-slide">
                      <div className="slide-image">
                        <img src={slide.image} alt={slide.title} />
                        <div className="slide-overlay"></div>
                      </div>
                      <div className="slide-text compact-text">
                        <h3 className="slide-title-compact">{slide.title}</h3>
                        <p className="slide-description-compact">{slide.description}</p>
                        <ul className="slide-features-compact">
                          {slide.features.map((feature, idx) => (
                            <li key={idx} className="slide-feature-compact">
                              <FiCheck className="feature-check" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="slide-controls compact-controls">
                <button 
                  className="slide-btn prev-btn"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + featuresSlides.length) % featuresSlides.length)}
                >
                  ‹
                </button>
                <div className="slide-indicators">
                  {featuresSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
                <button 
                  className="slide-btn next-btn"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % featuresSlides.length)}
                >
                  ›
                </button>
              </div>
            </div>
            
            {/* Banks Slideshow */}
            <div className="slideshow-container banks-slideshow">
              <div className="slide-content">
                <div 
                  className="slides-wrapper" 
                  style={{ transform: `translateX(-${currentBankSlide * 100}%)` }}
                >
                  {bankSlides.map((bank, index) => (
                    <div key={bank.id} className="slide bank-slide">
                      <div className="bank-slide-image">
                        <img src={bank.image} alt={bank.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="slide-controls compact-controls">
                <button 
                  className="slide-btn prev-btn"
                  onClick={() => setCurrentBankSlide((prev) => (prev - 1 + bankSlides.length) % bankSlides.length)}
                >
                  ‹
                </button>
                <div className="slide-indicators">
                  {bankSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentBankSlide ? 'active' : ''}`}
                      onClick={() => setCurrentBankSlide(index)}
                    />
                  ))}
                </div>
                <button 
                  className="slide-btn next-btn"
                  onClick={() => setCurrentBankSlide((prev) => (prev + 1) % bankSlides.length)}
                >
                  ›
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section reveal">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section reveal">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose InterBankHub?</h2>
            <p className="section-subtitle">
              Advanced banking features designed for modern financial needs
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section reveal">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="benefits-title">Everything You Need for Modern Banking</h2>
              <p className="benefits-subtitle">
                From everyday transactions to complex investments, we've got you covered with 
                industry-leading tools and services.
              </p>
              
              <ul className="benefits-list">
                {benefits.map((benefit, index) => (
                  <li key={index} className="benefit-item">
                    <FiCheck className="benefit-check" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link to="/browsebank" className="benefits-cta">
                Explore All Banks
                <FiArrowRight className="cta-icon" />
              </Link>
            </div>
            
            <div className="benefits-visual">
              <div className="floating-card card-1">
                <div className="card-header">
                  <div className="card-title">Balance</div>
                  <FiTrendingUp className="card-icon" />
                </div>
                <div className="card-amount">$12,349.80</div>
                <div className="card-change positive">+$234 this week</div>
              </div>
              
              <div className="floating-card card-2">
                <div className="card-header">
                  <div className="card-title">Quick Transfer</div>
                  <FiCreditCard className="card-icon" />
                </div>
                <div className="transfer-info">
                  <div className="transfer-to">To: John Smith</div>
                  <div className="transfer-amount">$500.00</div>
                </div>
              </div>
              
              <div className="floating-card card-3">
                <div className="card-header">
                  <div className="card-title">Security Status</div>
                  <FiShield className="card-icon" />
                </div>
                <div className="security-status">
                  <div className="status-indicator active"></div>
                  <span>All systems secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section reveal">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Banking Experience?</h2>
            <p className="cta-subtitle">
              Join millions of users who trust InterBankHub for their financial needs. 
              Open your account in minutes.
            </p>
            
            {!isSignedIn && (
              <div className="cta-buttons">
                <Link to="/signup" className="cta-primary-large">
                  Open Account Now
                  <FiArrowRight className="cta-icon" />
                </Link>
                <Link to="/about" className="cta-secondary-large">
                  Learn More
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage1;

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <>
      <Header />
      <div className="about-page">

        {/* ── Hero ── */}
        <section className="about-hero">
          <p className="about-eyebrow">INTERBANKHUB</p>
          <h1 className="about-hero-title">
            Banking infrastructure<br />built for <em>everyone.</em>
          </h1>
          <p className="about-hero-sub">
            One platform. Every account. Absolute confidence.
          </p>
        </section>

        {/* ── Divider ── */}
        <div className="about-rule" />

        {/* ── Main content ── */}
        <div className="about-grid">

          <article className="about-card">
            <p className="about-card-label">WHO WE ARE</p>
            <h2 className="about-card-heading">A new standard<br />for digital banking</h2>
            <p className="about-card-body">
              InterBankHub is a next-generation digital banking platform designed
              to bring all your banking needs under one roof. We connect users with
              multiple banks, offering seamless account management, secure transactions,
              and a unified experience for both individuals and administrators.
            </p>
          </article>

          <article className="about-card">
            <p className="about-card-label">OUR MISSION</p>
            <h2 className="about-card-heading">Simpler. Safer.<br /><em>Smarter.</em></h2>
            <p className="about-card-body">
              To empower users and banks with innovative technology, making banking
              simpler, safer, and more accessible for everyone. We believe in
              transparency, security, and customer-centric solutions that respect
              your time and your trust.
            </p>
          </article>

        </div>

        {/* ── Why choose us ── */}
        <section className="about-features">
          <p className="about-eyebrow">WHY CHOOSE US</p>
          <h2 className="about-features-heading">Five <em>reasons</em> to trust us</h2>
          <ul className="about-feature-list">
            <li className="about-feature-item">
              <span className="about-feature-num">01</span>
              <div>
                <strong>Unified dashboard</strong>
                <p>Manage every account you hold across any connected bank in one place.</p>
              </div>
            </li>
            <li className="about-feature-item">
              <span className="about-feature-num">02</span>
              <div>
                <strong>Advanced security</strong>
                <p>Role-based access control, session management, and privacy-first design.</p>
              </div>
            </li>
            <li className="about-feature-item">
              <span className="about-feature-num">03</span>
              <div>
                <strong>Intuitive experience</strong>
                <p>Designed to be clear and efficient — from first login to every transaction.</p>
              </div>
            </li>
            <li className="about-feature-item">
              <span className="about-feature-num">04</span>
              <div>
                <strong>24 / 7 support</strong>
                <p>Round-the-clock guidance so you're never left without an answer.</p>
              </div>
            </li>
            <li className="about-feature-item">
              <span className="about-feature-num">05</span>
              <div>
                <strong>Trusted by leading banks</strong>
                <p>Deployed across institutions that demand the highest operational standards.</p>
              </div>
            </li>
          </ul>
        </section>

      </div>
      <Footer />
    </>
  );
};

export default AboutPage;


import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Users, Zap, Link2 } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import veggieLogo from '../assets/veggie-radiance-logo.svg';
import '../styles/components.css';

const features = [
  { icon: Zap, title: 'Instant conversion tracking', text: 'Every click and sale tracked instantly with your personal referral links.' },
  { icon: Users, title: 'Multi-tier network earnings', text: 'Build your team and earn secondary commissions from your sub-affiliate network.' },
  { icon: ShieldCheck, title: 'Fast, reliable payouts', text: 'Transparent wallet balances, withdrawal requests, and automated direct payouts.' },
  { icon: BarChart3, title: 'Clear analytics dashboard', text: 'Simple, modern reports so you always know your exact earnings and progress.' }
];

export const Landing = () => (
  <main className="landing-page">
    <div className="landing-grid" />
    <div className="landing-glow landing-glow-one" />
    <div className="landing-glow landing-glow-two" />

    {/* Navigation Header */}
    <header className="landing-nav">
      <Link className="landing-brand" to="/">
        <img className="landing-brand-logo" src={veggieLogo} alt="VEGGIE Radiance" fetchPriority="high" loading="eager" />
      </Link>
      <div className="flex items-center gap-4">
        <Link className="landing-login-link" to={ROUTES.LOGIN}>Sign in</Link>
        <Link className="landing-cta landing-cta-primary" style={{ minHeight: '2.5rem', padding: '0.4rem 1rem', fontSize: '0.82rem' }} to={ROUTES.REGISTER}>Join program <ArrowRight size={15} /></Link>
      </div>
    </header>

    {/* Hero Section */}
    <section className="landing-hero" aria-label="Welcome banner">
      <div className="landing-copy">
        <span className="landing-eyebrow">New · Complete Affiliate & Partner Dashboard</span>
        <h1 className="landing-hero-heading">Grow with <span>VEGGIE</span> affiliate network</h1>
        <p className="landing-subhead">VEGGIE gives ambitious affiliates and team leaders one beautiful place to share, track, and grow their partnerships.</p>
        <div className="landing-actions">
          <Link className="landing-cta landing-cta-primary" to={ROUTES.REGISTER}>Become an affiliate <ArrowRight size={18} /></Link>
          <Link className="landing-cta landing-cta-secondary" to={ROUTES.LOGIN}>Login to your account</Link>
        </div>
        <div className="landing-proof"><CheckCircle2 size={17} /> Your links, commissions, and network — all in one place.</div>
      </div>

      {/* Visual Dashboard Preview */}
      <div className="landing-visual" aria-label="VEGGIE dashboard preview">
        <div className="landing-orbit landing-orbit-one" />
        <div className="landing-orbit landing-orbit-two" />
        <div className="landing-dashboard">
          <div className="dashboard-topbar">
            <span className="dashboard-logo">A</span>
            <span>Overview</span>
            <span className="dashboard-avatar">JD</span>
          </div>
          <div className="dashboard-content">
            <p className="dashboard-label">This month</p>
            <p className="dashboard-amount">₹8,420.50</p>
            <div className="dashboard-chart">
              <span /><span /><span /><span /><span /><span /><span />
            </div>
            <div className="dashboard-stats">
              <div><small>Clicks</small><strong>12.8k</strong></div>
              <div><small>Conversions</small><strong>842</strong></div>
            </div>
          </div>
        </div>
        <div className="landing-float-card landing-float-network">
          <Users size={18} />
          <span><strong>+24</strong> new partners</span>
        </div>
        <div className="landing-float-card landing-float-earnings">
          <span className="earning-dot" />
          <span><strong>Commission earned</strong><small>+₹1,280.00</small></span>
        </div>
      </div>
    </section>

    {/* Audiences / Role Cards */}
    <section className="landing-audiences" aria-label="Choose your role">
      <article className="landing-role landing-role-featured">
        <span className="landing-role-icon"><Users size={21} /></span>
        <p>For team builders</p>
        <h2>Super Affiliate</h2>
        <span>Lead your network, see team performance, and grow together with every referral.</span>
        <Link to={ROUTES.REGISTER}>Create Super Affiliate account <ArrowRight size={16} /></Link>
      </article>

      <article className="landing-role">
        <span className="landing-role-icon"><Link2 size={21} /></span>
        <p>For independent partners</p>
        <h2>Affiliate</h2>
        <span>Share your referral links, track conversions, and see your earnings grow in real time.</span>
        <Link to={ROUTES.REGISTER}>Create Affiliate account <ArrowRight size={16} /></Link>
      </article>
    </section>

    {/* Key Features Grid */}
    <section className="landing-features">
      {features.map(({ icon: Icon, title, text }) => (
        <article key={title}>
          <span><Icon size={21} /></span>
          <h2>{title}</h2>
          <p>{text}</p>
        </article>
      ))}
    </section>
  </main>
);

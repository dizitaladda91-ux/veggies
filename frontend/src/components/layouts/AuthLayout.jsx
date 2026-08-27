import React from 'react';
import veggieLogo from '../../assets/veggie-radiance-logo.svg';
import '../../styles/components.css';

export const AuthLayout = ({ children, title, subtitle, showAffiliateGuide = false }) => (
  <main className="auth-shell">
    <div className="auth-orb auth-orb-one" aria-hidden="true" />
    <div className="auth-orb auth-orb-two" aria-hidden="true" />
    <section className="auth-stage">
      <div className="auth-intro">
        <div className="veggie-brand" aria-label="VEGGIE Radiance">
          <img className="auth-brand-logo" src={veggieLogo} alt="VEGGIE Radiance" fetchPriority="high" loading="eager" />
        </div>
        <p className="auth-kicker">Affiliate partner portal</p>
        <h1>Build a network that grows with you.</h1>
        <p className="auth-intro-copy">A focused workspace to manage links, track commissions, and move every partnership forward.</p>
        {showAffiliateGuide && <div className="affiliate-guide" aria-label="Account types">
          <article className="affiliate-type affiliate-type-featured"><div className="affiliate-type-icon">↗</div><div><p className="affiliate-type-label">Super Affiliate</p><p>Lead a team, monitor network performance, and grow through your referrals.</p></div></article>
          <article className="affiliate-type"><div className="affiliate-type-icon">✦</div><div><p className="affiliate-type-label">Standard Affiliate</p><p>Create referral links, track conversions, and manage your earnings in one place.</p></div></article>
        </div>}
      </div>
      <div className="auth-card-wrap"><div className="auth-card card">
        <div className="auth-card-heading"><p className="auth-card-overline">Secure access</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {children}
      </div></div>
    </section>
  </main>
);

import React from 'react';

export const Footer = () => {
  return (
    <footer
      style={{
        padding: '1.25rem 2rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex justify-between items-center" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div>© {new Date().getFullYear()} Affiliate Cloud Inc. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#terms" style={{ color: 'inherit' }}>Terms of Service</a>
          <a href="#privacy" style={{ color: 'inherit' }}>Privacy Policy</a>
          <a href="#support" style={{ color: 'inherit' }}>API Docs</a>
        </div>
      </div>
    </footer>
  );
};

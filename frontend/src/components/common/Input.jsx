import React from 'react';

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'border-danger' : ''} ${className}`} {...props} />
      {error && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};

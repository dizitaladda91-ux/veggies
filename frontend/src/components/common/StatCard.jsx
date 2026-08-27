import React from 'react';

export const StatCard = ({ title, value, icon: Icon, footerText, trend }) => {
  return (
    <div className="card stat-card">
      <div>
        <div className="stat-header">
          <span className="stat-title">{title}</span>
          {Icon && (
            <div className="stat-icon-wrapper">
              <Icon size={20} />
            </div>
          )}
        </div>
        <div className="stat-value">{value}</div>
      </div>
      {footerText && <div className="stat-footer">{footerText}</div>}
    </div>
  );
};

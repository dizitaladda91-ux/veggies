import React from 'react';

export const Badge = ({ status, type = 'status', children }) => {
  const badgeClass = status ? `badge-${status.toLowerCase()}` : 'badge-role';
  return <span className={`badge ${badgeClass}`}>{children || status}</span>;
};

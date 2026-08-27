import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No data found', message = 'There are no records to display at this moment.', action }) => {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Inbox size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
      <h4 style={{ color: 'var(--text-main)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>{title}</h4>
      <p style={{ fontSize: '0.875rem', marginBottom: action ? '1.5rem' : 0 }}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

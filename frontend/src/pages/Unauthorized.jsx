import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Unauthorized = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem' }}>
      <ShieldAlert size={64} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>403 - Access Denied</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
        You do not have the required role permissions to access this area.
      </p>
      <Link to="/login">
        <Button>Back to Sign In</Button>
      </Link>
    </div>
  );
};

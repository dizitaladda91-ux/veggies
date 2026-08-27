import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import api from '../services/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showSuccess } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/auth/forgot-password', { email });
    setSubmitted(true);
    showSuccess('Password reset link sent to your email.');
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive recovery instructions">
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" style={{ width: '100%', marginTop: '1rem' }}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            We've sent password reset instructions to <strong>{email}</strong>.
          </p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

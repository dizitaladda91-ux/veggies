import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { ROUTES } from '../constants/routes';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const resetToken = token || searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');

    if (!resetToken) {
      setErrorMsg('Password reset link is invalid or missing token.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password });
      setSuccess(true);
      setMessage('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err?.message || 'Password reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a new strong password to secure your affiliate account"
    >
      {success ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Password Reset Complete!</h3>
          <p className="text-sm text-emerald-200/80">{message}</p>
          <div className="pt-2">
            <Button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Go to Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="Enter at least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          <div className="text-center pt-3 text-xs text-emerald-300/70">
            Remembered your password?{' '}
            <Link to={ROUTES.LOGIN} className="text-emerald-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

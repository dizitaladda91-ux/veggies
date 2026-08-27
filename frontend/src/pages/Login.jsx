import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { enableMfa, setupMfa, verifyMfaLogin } from '../services/authService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [code, setCode] = useState('');

  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        if (result.mfaSetupRequired) { const setup = await setupMfa(result.mfaToken); setMfa({ ...result, ...setup }); } else setMfa(result);
        return;
      }
      const user = result.user;
      showSuccess('Welcome back!');

      // Role-based redirect
      switch (user.role_name) {
        case ROLES.SUPER_ADMIN:
          navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
          break;
        case ROLES.ADMIN:
          navigate(ROUTES.ADMIN_DASHBOARD);
          break;
        case ROLES.SUPER_AFFILIATE:
          navigate(ROUTES.SUPER_AFFILIATE_DASHBOARD);
          break;
        case ROLES.AFFILIATE:
        default:
          navigate(ROUTES.AFFILIATE_DASHBOARD);
          break;
      }
    } catch (err) {
      showError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };
  const completeMfa = async (e) => { e.preventDefault(); setLoading(true); try { const user = mfa.mfaSetupRequired ? await enableMfa(mfa.mfaToken, mfa.secret, code) : await verifyMfaLogin(mfa.mfaToken, code); showSuccess('Authenticator verified.'); navigate(user.role_name === ROLES.SUPER_ADMIN ? ROUTES.SUPER_ADMIN_DASHBOARD : ROUTES.ADMIN_DASHBOARD); } catch (err) { showError(err.message || 'Invalid authenticator code.'); } finally { setLoading(false); } };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Veggie partner account." showAffiliateGuide>
      {mfa ? <form onSubmit={completeMfa}>
        <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>{mfa.mfaSetupRequired ? `Add this secret to Google Authenticator, Microsoft Authenticator, or Authy: ${mfa.secret}` : 'Enter the six-digit code from your authenticator app.'}</p>
        <Input label="Authenticator code" inputMode="numeric" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>{mfa.mfaSetupRequired ? 'Enable authenticator' : 'Verify and sign in'}</Button>
      </form> : <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
          <label className="flex items-center gap-2" style={{ cursor: 'pointer', color: '#cbd5e1' }}>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <Link to={ROUTES.FORGOT_PASSWORD} style={{ color: '#818cf8', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Sign In
        </Button>
      </form>}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} style={{ color: '#818cf8', fontWeight: 700 }}>
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
};

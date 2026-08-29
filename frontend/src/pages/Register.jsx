import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, ShieldCheck, Sparkles, Mail } from 'lucide-react';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    officialEmail: '',
    company: '',
    password: '',
    role: 'affiliate',
  });
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      showError('Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const recruitmentCode = searchParams.get('ref');
      const user = await register({
        ...formData,
        officialEmail: formData.officialEmail || formData.email,
        ...(recruitmentCode && { recruitmentCode }),
      });
      showSuccess('Account created successfully!');

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
      showError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up your partner profile in less than a minute." showAffiliateGuide>
      <form className="register-form space-y-4" onSubmit={handleSubmit}>
        <div className="register-name-grid">
          <Input
            label="First name *"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last name *"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Account Username / Login ID *"
          type="text"
          name="email"
          placeholder="e.g. satyamalora or satyam@login"
          autoComplete="username"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Official Email Field */}
        <div className="form-group bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
          <label className="form-label font-bold text-amber-300 flex items-center gap-1.5 text-xs">
            <Mail className="w-4 h-4 text-amber-400" /> OFFICIAL NOTIFICATION EMAIL (VALID ACTIVE EMAIL) *
          </label>
          <input
            type="email"
            name="officialEmail"
            placeholder="e.g. yourname@gmail.com (Valid Active Email)"
            className="form-input bg-emerald-950/80 border-amber-500/40 text-amber-300 font-medium text-xs py-2.5 px-3 rounded-xl w-full"
            value={formData.officialEmail}
            onChange={handleChange}
            required
          />
          <span className="text-[11px] text-emerald-200/70 block mt-1">
            📧 Password reset links, earnings alerts, & payout receipts will be sent to this official email.
          </span>
        </div>

        <Input
          label="Company or brand name"
          name="company"
          placeholder="Optional - e.g. Acme Growth"
          value={formData.company}
          onChange={handleChange}
        />

        <div className="form-group register-role-group">
          <div className="register-field-heading">
            <label className="form-label" htmlFor="account-role">How will you use Veggie?</label>
            <span>Choose the option that fits you best</span>
          </div>
          <select
            id="account-role"
            name="role"
            className="form-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="affiliate">I'll promote offers and earn commissions</option>
            <option value="super_affiliate">I'll lead a team of affiliates</option>
          </select>
        </div>

        <div className="register-password-grid">
          <div className="form-group password-field">
            <label className="form-label" htmlFor="password">Create password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="form-group password-field">
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="password-input-wrap">
              <input
                id="confirmPassword"
                className="form-input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </div>

        <p className="register-password-hint"><Check size={14} /> Use 8 or more characters for a secure password.</p>
        <div className="register-trust-note"><ShieldCheck size={16} /><span>Your details are protected with secure encryption.</span></div>
        <Button type="submit" loading={loading} className="register-submit">
          <Sparkles size={17} /> Create my account
        </Button>
      </form>
      <div className="register-signin">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, ShieldCheck, Sparkles, Mail, CheckCircle2, Send, RefreshCw, Lock } from 'lucide-react';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import api from '../services/api';

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

  // Email 6-Digit OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset OTP verification if email is edited
    if (e.target.name === 'officialEmail') {
      setOtpSent(false);
      setIsEmailVerified(false);
      setOtpCode('');
    }
  };

  const handleSendOtp = async () => {
    const emailToVerify = (formData.officialEmail || formData.email).trim();
    if (!emailToVerify || !/^\S+@\S+\.\S+$/.test(emailToVerify)) {
      showError('Please enter a valid official email address first.');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await api.post('/auth/send-registration-otp', { email: emailToVerify });
      setOtpSent(true);

      const devCode = response.data?.data?.devOtpCode;
      if (devCode) {
        showSuccess(`Code generated: ${devCode} (Server email network timed out)`);
        setOtpCode(devCode);
      } else {
        setOtpCode('');
        showSuccess(`6-Digit verification code sent to ${emailToVerify}! Check your inbox or spam folder.`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const emailToVerify = (formData.officialEmail || formData.email).trim();
    if (!otpCode || otpCode.trim().length !== 6) {
      showError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-registration-otp', { email: emailToVerify, otpCode: otpCode.trim() });
      setIsEmailVerified(true);
      showSuccess('Official email verified successfully! ✅ You can now create your account.');
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailVerified) {
      showError('Please verify your Official Notification Email with the 6-digit code first.');
      return;
    }

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

        {/* Official Email Field with 6-Digit OTP Verification */}
        <div className="form-group bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <label className="form-label font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Mail className="w-4 h-4 text-amber-400" /> OFFICIAL NOTIFICATION EMAIL (VALID ACTIVE EMAIL) *
            </label>
            {isEmailVerified && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified ✅
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="email"
              name="officialEmail"
              placeholder="e.g. yourname@gmail.com (Valid Active Email)"
              className={`form-input bg-emerald-950/80 border-amber-500/40 text-amber-300 font-medium text-xs py-2.5 px-3 rounded-xl w-full ${
                isEmailVerified ? 'opacity-80 cursor-not-allowed' : ''
              }`}
              value={formData.officialEmail}
              onChange={handleChange}
              disabled={isEmailVerified}
              required
            />
          </div>

          {/* Action Row: Send Code / OTP Input / Verify */}
          {!isEmailVerified && (
            <div className="space-y-3 pt-1">
              {!otpSent ? (
                <Button
                  type="button"
                  loading={sendingOtp}
                  onClick={handleSendOtp}
                  className="btn-primary text-xs py-2 px-4 w-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Send 6-Digit Verification Code
                </Button>
              ) : (
                <div className="space-y-2 bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20">
                  <p className="text-[11px] text-amber-300 font-medium">
                    ✉️ Enter 6-digit code sent to <strong>{formData.officialEmail || formData.email}</strong>:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="e.g. 749204"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="form-input bg-emerald-950 text-white font-mono text-center tracking-widest text-base font-bold py-2 px-3 rounded-xl border-emerald-500/40 w-36"
                    />

                    <Button
                      type="button"
                      loading={verifyingOtp}
                      onClick={handleVerifyOtp}
                      className="btn-primary text-xs py-2 px-4 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Verify Code
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-emerald-300/70">Code valid for 10 minutes</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <span className="text-[11px] text-emerald-200/70 block">
            📧 Official notifications, password reset links, & payout receipts will be sent to this email.
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
        <Button type="submit" loading={loading} disabled={!isEmailVerified} className="register-submit">
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

import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Helper for dynamic imports that automatically handles stale cache chunks after Vercel deployments
const safeLazy = (importFn) =>
  lazy(() =>
    importFn().catch((error) => {
      console.warn('Dynamic module import failed (stale Vercel deployment cache):', error);
      const storageKey = 'veggie_chunk_reload_attempts';
      const attempts = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
      if (attempts < 2) {
        sessionStorage.setItem(storageKey, String(attempts + 1));
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    })
  );

// Page Component Lazy Imports
const Login = safeLazy(() => import('../pages/Login').then(({ Login: Page }) => ({ default: Page })));
const Landing = safeLazy(() => import('../pages/Landing').then(({ Landing: Page }) => ({ default: Page })));
const Register = safeLazy(() => import('../pages/Register').then(({ Register: Page }) => ({ default: Page })));
const ForgotPassword = safeLazy(() => import('../pages/ForgotPassword').then(({ ForgotPassword: Page }) => ({ default: Page })));
const ResetPassword = safeLazy(() => import('../pages/ResetPassword').then(({ ResetPassword: Page }) => ({ default: Page })));
const VerifyEmail = safeLazy(() => import('../pages/VerifyEmail').then(({ VerifyEmail: Page }) => ({ default: Page })));
const RedirectRef = safeLazy(() => import('../pages/RedirectRef').then(({ RedirectRef: Page }) => ({ default: Page })));
const Unauthorized = safeLazy(() => import('../pages/Unauthorized').then(({ Unauthorized: Page }) => ({ default: Page })));
const NotFound = safeLazy(() => import('../pages/NotFound').then(({ NotFound: Page }) => ({ default: Page })));
const SuperAdminDashboard = safeLazy(() => import('../pages/SuperAdminDashboard').then(({ SuperAdminDashboard: Page }) => ({ default: Page })));
const AdminDashboard = safeLazy(() => import('../pages/AdminDashboard').then(({ AdminDashboard: Page }) => ({ default: Page })));
const SuperAffiliateDashboard = safeLazy(() => import('../pages/SuperAffiliateDashboard').then(({ SuperAffiliateDashboard: Page }) => ({ default: Page })));
const AffiliateDashboard = safeLazy(() => import('../pages/AffiliateDashboard').then(({ AffiliateDashboard: Page }) => ({ default: Page })));
const UserManagement = safeLazy(() => import('../pages/UserManagement').then(({ UserManagement: Page }) => ({ default: Page })));
const CommissionRules = safeLazy(() => import('../pages/CommissionRules').then(({ CommissionRules: Page }) => ({ default: Page })));
const ReferralLinks = safeLazy(() => import('../pages/ReferralLinks').then(({ ReferralLinks: Page }) => ({ default: Page })));
const Earnings = safeLazy(() => import('../pages/Earnings').then(({ Earnings: Page }) => ({ default: Page })));
const TeamManagement = safeLazy(() => import('../pages/TeamManagement').then(({ TeamManagement: Page }) => ({ default: Page })));
const AuditLogs = safeLazy(() => import('../pages/AuditLogs').then(({ AuditLogs: Page }) => ({ default: Page })));
const SystemSettings = safeLazy(() => import('../pages/SystemSettings').then(({ SystemSettings: Page }) => ({ default: Page })));
const Profile = safeLazy(() => import('../pages/Profile').then(({ Profile: Page }) => ({ default: Page })));
const Wallet = safeLazy(() => import('../pages/Wallet').then(({ Wallet: Page }) => ({ default: Page })));
const Withdrawals = safeLazy(() => import('../pages/Withdrawals').then(({ Withdrawals: Page }) => ({ default: Page })));
const BankAccounts = safeLazy(() => import('../pages/BankAccounts').then(({ BankAccounts: Page }) => ({ default: Page })));
const AdminWithdrawals = safeLazy(() => import('../pages/AdminWithdrawals').then(({ AdminWithdrawals: Page }) => ({ default: Page })));
const AdminBankAccounts = safeLazy(() => import('../pages/AdminBankAccounts').then(({ AdminBankAccounts: Page }) => ({ default: Page })));
const MarketingAssets = safeLazy(() => import('../pages/MarketingAssets').then(({ MarketingAssets: Page }) => ({ default: Page })));

export const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    // Clear reload attempts counter upon successful route navigation
    sessionStorage.removeItem('veggie_chunk_reload_attempts');
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<main aria-busy="true" className="min-h-screen bg-[#04120e]" />}>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
          <Route path={ROUTES.REF_REDIRECT} element={<RedirectRef />} />
          <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

          {/* Super Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path={ROUTES.SUPER_ADMIN_DASHBOARD} element={<SuperAdminDashboard />} />
            <Route path={ROUTES.SYSTEM_SETTINGS} element={<SystemSettings />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />}>
            <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
            <Route path={ROUTES.USER_MANAGEMENT} element={<UserManagement />} />
            <Route path={ROUTES.COMMISSION_RULES} element={<CommissionRules />} />
            <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />
            <Route path={ROUTES.ADMIN_WITHDRAWALS} element={<AdminWithdrawals />} />
            <Route path={ROUTES.ADMIN_BANK_ACCOUNTS} element={<AdminBankAccounts />} />
          </Route>

          {/* Super Affiliate Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_AFFILIATE]} />}>
            <Route path={ROUTES.SUPER_AFFILIATE_DASHBOARD} element={<SuperAffiliateDashboard />} />
            <Route path={ROUTES.TEAM_TRACKING} element={<TeamManagement />} />
          </Route>

          {/* Shared Affiliate Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPER_AFFILIATE, ROLES.AFFILIATE]} />}>
            <Route path={ROUTES.AFFILIATE_DASHBOARD} element={<AffiliateDashboard />} />
            <Route path={ROUTES.REFERRAL_LINKS} element={<ReferralLinks />} />
            <Route path={ROUTES.EARNINGS} element={<Earnings />} />
            <Route path={ROUTES.WALLET} element={<Wallet />} />
            <Route path={ROUTES.WITHDRAWALS} element={<Withdrawals />} />
            <Route path={ROUTES.BANK_ACCOUNTS} element={<BankAccounts />} />
            <Route path={ROUTES.PROFILE} element={<Profile />} />
            <Route path={ROUTES.MARKETING_ASSETS} element={<MarketingAssets />} />
          </Route>

          <Route path={ROUTES.HOME} element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

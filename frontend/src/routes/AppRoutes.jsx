import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Keep the public landing page lean. Dashboard modules are loaded only after a
// user navigates to them instead of becoming part of every visitor's first JS.
const Login = lazy(() => import('../pages/Login').then(({ Login: Page }) => ({ default: Page })));
const Landing = lazy(() => import('../pages/Landing').then(({ Landing: Page }) => ({ default: Page })));
const Register = lazy(() => import('../pages/Register').then(({ Register: Page }) => ({ default: Page })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(({ ForgotPassword: Page }) => ({ default: Page })));
const ResetPassword = lazy(() => import('../pages/ResetPassword').then(({ ResetPassword: Page }) => ({ default: Page })));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail').then(({ VerifyEmail: Page }) => ({ default: Page })));
const RedirectRef = lazy(() => import('../pages/RedirectRef').then(({ RedirectRef: Page }) => ({ default: Page })));
const Unauthorized = lazy(() => import('../pages/Unauthorized').then(({ Unauthorized: Page }) => ({ default: Page })));
const NotFound = lazy(() => import('../pages/NotFound').then(({ NotFound: Page }) => ({ default: Page })));
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdminDashboard').then(({ SuperAdminDashboard: Page }) => ({ default: Page })));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then(({ AdminDashboard: Page }) => ({ default: Page })));
const SuperAffiliateDashboard = lazy(() => import('../pages/SuperAffiliateDashboard').then(({ SuperAffiliateDashboard: Page }) => ({ default: Page })));
const AffiliateDashboard = lazy(() => import('../pages/AffiliateDashboard').then(({ AffiliateDashboard: Page }) => ({ default: Page })));
const UserManagement = lazy(() => import('../pages/UserManagement').then(({ UserManagement: Page }) => ({ default: Page })));
const CommissionRules = lazy(() => import('../pages/CommissionRules').then(({ CommissionRules: Page }) => ({ default: Page })));
const ReferralLinks = lazy(() => import('../pages/ReferralLinks').then(({ ReferralLinks: Page }) => ({ default: Page })));
const Earnings = lazy(() => import('../pages/Earnings').then(({ Earnings: Page }) => ({ default: Page })));
const TeamManagement = lazy(() => import('../pages/TeamManagement').then(({ TeamManagement: Page }) => ({ default: Page })));
const AuditLogs = lazy(() => import('../pages/AuditLogs').then(({ AuditLogs: Page }) => ({ default: Page })));
const SystemSettings = lazy(() => import('../pages/SystemSettings').then(({ SystemSettings: Page }) => ({ default: Page })));
const Profile = lazy(() => import('../pages/Profile').then(({ Profile: Page }) => ({ default: Page })));
const Wallet = lazy(() => import('../pages/Wallet').then(({ Wallet: Page }) => ({ default: Page })));
const Withdrawals = lazy(() => import('../pages/Withdrawals').then(({ Withdrawals: Page }) => ({ default: Page })));
const BankAccounts = lazy(() => import('../pages/BankAccounts').then(({ BankAccounts: Page }) => ({ default: Page })));
const AdminWithdrawals = lazy(() => import('../pages/AdminWithdrawals').then(({ AdminWithdrawals: Page }) => ({ default: Page })));
const AdminBankAccounts = lazy(() => import('../pages/AdminBankAccounts').then(({ AdminBankAccounts: Page }) => ({ default: Page })));
const MarketingAssets = lazy(() => import('../pages/MarketingAssets').then(({ MarketingAssets: Page }) => ({ default: Page })));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
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
  );
};

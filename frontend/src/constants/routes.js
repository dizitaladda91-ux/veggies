export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  VERIFY_EMAIL: '/verify-email/:token',
  REF_REDIRECT: '/ref/:code',
  UNAUTHORIZED: '/unauthorized',

  // Dashboards
  SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  SUPER_AFFILIATE_DASHBOARD: '/super-affiliate/dashboard',
  AFFILIATE_DASHBOARD: '/affiliate/dashboard',

  // Management Modules
  USER_MANAGEMENT: '/admin/users',
  AFFILIATE_APPROVALS: '/admin/affiliates/approvals',
  COMMISSION_RULES: '/admin/commission-rules',
  ADMIN_COMMISSIONS: '/admin/commissions',
  TEAM_TRACKING: '/super-affiliate/team',
  REFERRAL_LINKS: '/affiliate/links',
  EARNINGS: '/affiliate/earnings',
  WALLET: '/affiliate/wallet',
  WITHDRAWALS: '/affiliate/withdrawals',
  BANK_ACCOUNTS: '/affiliate/bank-accounts',
  AUDIT_LOGS: '/admin/audit-logs',
  SYSTEM_SETTINGS: '/admin/settings',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_BANK_ACCOUNTS: '/admin/bank-accounts',
  PROFILE: '/profile',
  MARKETING_ASSETS: '/marketing-assets',
};

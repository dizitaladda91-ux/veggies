import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  Users,
  Percent,
  Link as LinkIcon,
  DollarSign,
  FileText,
  Settings,
  User,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  CreditCard,
  Building2,
  PieChart,
  LogOut,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role_name || ROLES.AFFILIATE;

  // Custom Portal Badges & Colors per Role
  const getPortalInfo = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return {
          title: 'SUPER ADMIN',
          badge: '👑 SUPER ADMIN',
          badgeClass: 'portal-badge-superadmin',
          tagline: 'System Operations & Governance',
        };
      case ROLES.ADMIN:
        return {
          title: 'ADMIN PORTAL',
          badge: '🛡️ ADMIN PORTAL',
          badgeClass: 'portal-badge-admin',
          tagline: 'Network & Payout Controls',
        };
      case ROLES.SUPER_AFFILIATE:
        return {
          title: 'SUPER AFFILIATE',
          badge: '⭐ SUPER AFFILIATE',
          badgeClass: 'portal-badge-superaffiliate',
          tagline: 'Team Leadership & Earnings',
        };
      case ROLES.AFFILIATE:
      default:
        return {
          title: 'AFFILIATE PORTAL',
          badge: '🚀 AFFILIATE PORTAL',
          badgeClass: 'portal-badge-affiliate',
          tagline: 'Promotions & Commissions',
        };
    }
  };

  const portalInfo = getPortalInfo();

  // Grouped Navigation Items per Role
  const getNavSections = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return [
          {
            section: 'OVERVIEW',
            items: [{ label: 'Dashboard', path: ROUTES.SUPER_ADMIN_DASHBOARD, icon: LayoutDashboard }],
          },
          {
            section: 'MANAGEMENT',
            items: [
              { label: 'All Users', path: ROUTES.USER_MANAGEMENT, icon: Users },
              { label: 'Commission Rules', path: ROUTES.COMMISSION_RULES, icon: Percent },
              { label: 'Marketing Banners', path: ROUTES.MARKETING_ASSETS, icon: ImageIcon },
            ],
          },
          {
            section: 'GOVERNANCE',
            items: [
              { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: ShieldAlert },
              { label: 'System Settings', path: ROUTES.SYSTEM_SETTINGS, icon: Settings },
            ],
          },
        ];
      case ROLES.ADMIN:
        return [
          {
            section: 'OVERVIEW',
            items: [{ label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard }],
          },
          {
            section: 'NETWORK',
            items: [
              { label: 'Affiliates', path: ROUTES.USER_MANAGEMENT, icon: Users },
              { label: 'Commission Engine', path: ROUTES.COMMISSION_RULES, icon: Percent },
              { label: 'Marketing Banners', path: ROUTES.MARKETING_ASSETS, icon: ImageIcon },
            ],
          },
          {
            section: 'FINANCIAL OPS',
            items: [
              { label: 'Withdrawals & Payouts', path: ROUTES.ADMIN_WITHDRAWALS, icon: DollarSign },
              { label: 'Bank Verification', path: ROUTES.ADMIN_BANK_ACCOUNTS, icon: Building2 },
              { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: FileText },
            ],
          },
        ];
      case ROLES.SUPER_AFFILIATE:
        return [
          {
            section: 'OVERVIEW',
            items: [
              { label: 'Dashboard', path: ROUTES.SUPER_AFFILIATE_DASHBOARD, icon: LayoutDashboard },
              { label: 'My Team', path: ROUTES.TEAM_TRACKING, icon: Users },
            ],
          },
          {
            section: 'MARKETING',
            items: [
              { label: 'Referral Links', path: ROUTES.REFERRAL_LINKS, icon: LinkIcon },
              { label: 'Marketing Banners', path: ROUTES.MARKETING_ASSETS, icon: ImageIcon },
            ],
          },
          {
            section: 'FINANCE',
            items: [
              { label: 'Earnings', path: ROUTES.EARNINGS, icon: PieChart },
              { label: 'My Wallet', path: ROUTES.WALLET, icon: CreditCard },
              { label: 'Withdrawals', path: ROUTES.WITHDRAWALS, icon: DollarSign },
              { label: 'Bank Accounts', path: ROUTES.BANK_ACCOUNTS, icon: Building2 },
            ],
          },
        ];
      case ROLES.AFFILIATE:
      default:
        return [
          {
            section: 'OVERVIEW',
            items: [{ label: 'Dashboard', path: ROUTES.AFFILIATE_DASHBOARD, icon: LayoutDashboard }],
          },
          {
            section: 'PROMOTIONS',
            items: [
              { label: 'Referral Links', path: ROUTES.REFERRAL_LINKS, icon: LinkIcon },
              { label: 'Marketing Banners', path: ROUTES.MARKETING_ASSETS, icon: ImageIcon },
            ],
          },
          {
            section: 'FINANCE & PAYOUTS',
            items: [
              { label: 'Earnings', path: ROUTES.EARNINGS, icon: PieChart },
              { label: 'My Wallet', path: ROUTES.WALLET, icon: CreditCard },
              { label: 'Withdrawals', path: ROUTES.WITHDRAWALS, icon: DollarSign },
              { label: 'Bank Accounts', path: ROUTES.BANK_ACCOUNTS, icon: Building2 },
            ],
          },
        ];
    }
  };

  const navSections = getNavSections();
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'User';
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  const handleLogout = async (e) => {
    e?.preventDefault();
    await logout();
  };

  return (
    <aside className="premium-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-brand-mark">
            <Sparkles size={20} className="brand-icon-sparkle" />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="sidebar-brand-title">VEGGIE AFFILIATE</h1>
            <span className="sidebar-brand-subtitle">AFFILIATE NETWORK</span>
          </div>
        </div>

        {/* Dynamic Portal Badge */}
        <div className={`portal-badge ${portalInfo.badgeClass}`}>
          <span className="portal-badge-text">{portalInfo.badge}</span>
          <span className="portal-badge-status">
            <span className="live-dot" /> LIVE
          </span>
        </div>
      </div>

      {/* Navigation Links Grouped */}
      <nav className="sidebar-navigation">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx} className="sidebar-section">
            <div className="sidebar-menu-label">{sec.section}</div>
            {sec.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`
                  }
                >
                  <span className="nav-icon-box">
                    <Icon size={18} />
                  </span>
                  <span className="nav-label-text">{item.label}</span>
                  <span className="nav-hover-accent" />
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Quick Logout */}
      <div className="sidebar-footer">
        <NavLink
          to={ROUTES.PROFILE}
          className={({ isActive }) =>
            `sidebar-profile-card ${isActive ? 'sidebar-profile-card-active' : ''}`
          }
        >
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
            <span className="sidebar-user-role">{role.replace('_', ' ')}</span>
          </div>
          <User size={16} className="sidebar-profile-icon" />
        </NavLink>

        <button type="button" onClick={handleLogout} className="sidebar-logout-btn" title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../common/Badge';
import {
  Sun,
  Moon,
  LogOut,
  Search,
  ChevronDown,
  Settings,
  Bell,
  User,
  Shield,
  HelpCircle,
  Sparkles,
  CheckCheck,
  Building2,
  DollarSign,
  UserPlus,
  Info,
  CreditCard,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { notificationService } from '../../services/notificationService';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const navigate = useNavigate();

  const role = user?.role_name || ROLES.AFFILIATE;
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'User';
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await notificationService.getNotifications(15);
      if (res.success && res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Fail silently
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Handle Mark as Read
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {}
  };

  // Handle Mark All as Read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {}
  };

  // Role portal header subtitle
  const getPortalTag = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return { text: 'Super Admin Portal', icon: Shield };
      case ROLES.ADMIN:
        return { text: 'Admin Operations', icon: Shield };
      case ROLES.SUPER_AFFILIATE:
        return { text: 'Super Affiliate Dashboard', icon: Sparkles };
      case ROLES.AFFILIATE:
      default:
        return { text: 'Affiliate Portal', icon: Sparkles };
    }
  };

  const portalTag = getPortalTag();
  const TagIcon = portalTag.icon;

  // Relative time helper
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Notification Icon Type Helper
  const getNotifIcon = (type) => {
    switch (type) {
      case 'conversion':
        return <DollarSign size={15} className="notif-type-icon notif-icon-success" />;
      case 'withdrawal':
        return <CreditCard size={15} className="notif-type-icon notif-icon-indigo" />;
      case 'new_affiliate':
        return <UserPlus size={15} className="notif-type-icon notif-icon-purple" />;
      case 'bank_verification':
        return <Building2 size={15} className="notif-type-icon notif-icon-cyan" />;
      default:
        return <Info size={15} className="notif-type-icon notif-icon-info" />;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToProfile = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.PROFILE);
  };

  const goToSettings = () => {
    setProfileMenuOpen(false);
    if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
      navigate(ROUTES.SYSTEM_SETTINGS);
    } else {
      navigate(ROUTES.PROFILE);
    }
  };

  const handleLogout = async (e) => {
    e?.preventDefault();
    setProfileMenuOpen(false);
    await logout();
  };

  return (
    <header className="premium-header">
      {/* Search & Portal Indicator */}
      <div className="header-left">
        <div className="header-portal-indicator">
          <TagIcon size={16} className="portal-tag-icon" />
          <span className="portal-tag-text">{portalTag.text}</span>
        </div>

        <div className="header-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search campaigns, affiliates, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          <span className="search-kbd-badge">⌘K</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-right">
        {/* Interactive Notifications Bell */}
        <div className="header-notif-wrapper" ref={notifDropdownRef}>
          <button
            className={`header-action-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="notifications-dropdown">
              <div className="notif-dropdown-header">
                <div className="flex items-center gap-2">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="notif-mark-all-btn">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="notif-empty-state">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <Bell size={24} className="notif-empty-icon" />
                    <p>No notifications yet</p>
                    <small>We'll notify you about earnings, withdrawals, and updates here.</small>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item.id, item.is_read)}
                      className={`notif-item ${!item.is_read ? 'notif-item-unread' : ''}`}
                    >
                      <div className="notif-item-icon-col">
                        {getNotifIcon(item.type)}
                      </div>
                      <div className="notif-item-content">
                        <div className="flex items-center justify-between">
                          <strong className="notif-item-title">{item.title}</strong>
                          <span className="notif-item-time">{getRelativeTime(item.created_at)}</span>
                        </div>
                        <p className="notif-item-msg">{item.message}</p>
                      </div>
                      {!item.is_read && <span className="notif-unread-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button onClick={toggleTheme} className="header-action-btn theme-toggle-btn" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} className="theme-icon-sun" /> : <Moon size={18} className="theme-icon-moon" />}
        </button>

        {/* User Profile Pill */}
        <div className="header-profile-wrapper" ref={dropdownRef}>
          <button
            className="header-profile-trigger"
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
          >
            <div className="header-avatar-ring">
              {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
            </div>
            <div className="header-user-meta">
              <span className="header-user-name">{displayName}</span>
              <Badge status={user?.role_name}>{user?.role_name?.replace('_', ' ')}</Badge>
            </div>
            <ChevronDown size={15} className={`header-chevron ${profileMenuOpen ? 'chevron-rotated' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="header-profile-dropdown">
              <div className="dropdown-user-header">
                <div className="dropdown-avatar">{initials}</div>
                <div>
                  <strong className="dropdown-user-title">{displayName}</strong>
                  <span className="dropdown-user-email">{user?.email}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button type="button" onClick={goToProfile} className="dropdown-item">
                <User size={16} /> Edit Profile
              </button>

              {(role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) && (
                <button type="button" onClick={goToSettings} className="dropdown-item">
                  <Settings size={16} /> System Settings
                </button>
              )}

              <a
                href="https://veggieradiance.com/support"
                target="_blank"
                rel="noreferrer"
                className="dropdown-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <HelpCircle size={16} /> Help & Support
              </a>

              <div className="dropdown-divider" />

              <button type="button" onClick={handleLogout} className="dropdown-item dropdown-logout">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

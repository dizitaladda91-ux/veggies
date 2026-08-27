-- =====================================================================
-- Enterprise Affiliate Management System - Full Complete SQL Script
-- Includes: All 17 Database Tables DDL + Indexes + Full Seed Data
-- Compatible with: Supabase PostgreSQL / Standard PostgreSQL 13+
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. TABLE CREATION (DDL)
-- ---------------------------------------------------------------------

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 2. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  CONSTRAINT unique_action_resource UNIQUE(action, resource)
);

-- 3. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
  is_email_verified BOOLEAN DEFAULT FALSE,
  refresh_token TEXT DEFAULT NULL,
  parent_affiliate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  company VARCHAR(150),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 6. AFFILIATE_LINKS
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  title VARCHAR(150) DEFAULT 'Main Referral Link',
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 7. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 8. CLICK_EVENTS
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer_url TEXT,
  country VARCHAR(10) DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 9. CONVERSION_EVENTS
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES click_events(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 10. COMMISSION_RULES
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'flat')),
  value NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 11. COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES conversion_events(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 12. WITHDRAW_REQUESTS
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  payment_details JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 13. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('commission', 'withdrawal', 'adjustment', 'payout')),
  amount NUMERIC(12, 2) NOT NULL,
  reference_id UUID,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), gateway_order_id VARCHAR(100) NOT NULL UNIQUE, gateway_payment_id VARCHAR(100) UNIQUE,
  affiliate_id UUID NOT NULL REFERENCES users(id), click_id UUID NOT NULL REFERENCES click_events(id), referral_code VARCHAR(50) NOT NULL,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb, amount NUMERIC(12,2) NOT NULL, original_amount NUMERIC(12,2) NOT NULL, discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR', status VARCHAR(30) NOT NULL CHECK (status IN ('CREATED','PENDING','SUCCESS','FAILED','REFUNDED','PARTIALLY_REFUNDED','CANCELLED')),
  gateway_response JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID REFERENCES payments(id) ON DELETE CASCADE, event_type VARCHAR(80) NOT NULL, payload JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS webhook_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), gateway_event_id VARCHAR(100) NOT NULL UNIQUE, event_type VARCHAR(80) NOT NULL, payload JSONB NOT NULL, status VARCHAR(20) NOT NULL, processed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS refunds (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID NOT NULL REFERENCES payments(id), gateway_refund_id VARCHAR(100) NOT NULL UNIQUE, amount NUMERIC(12,2) NOT NULL, status VARCHAR(30) NOT NULL, gateway_response JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_payments_affiliate ON payments(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at DESC);

-- 15. ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 16. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  changes_json JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 17. SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- ---------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_click_events_code ON click_events(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_events_order_id ON conversion_events(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);

-- ---------------------------------------------------------------------
-- 4. SEED DATA
-- ---------------------------------------------------------------------

-- Seed Roles
INSERT INTO roles (id, name, description) VALUES
('11111111-1111-4111-a111-111111111111', 'super_admin', 'Full system access and administrative management'),
('22222222-2222-4222-a222-222222222222', 'admin', 'Manages affiliates, approvals, and commission rules'),
('33333333-3333-4333-a333-333333333333', 'super_affiliate', 'Team leader managing multi-level sub-affiliates'),
('44444444-4444-4444-a444-444444444444', 'affiliate', 'Standard referral affiliate')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Commission Rules
INSERT INTO commission_rules (id, name, type, value, is_active) VALUES
('a1111111-1111-4111-a111-111111111111', 'Default Standard Commission Rate', 'percentage', 15.00, true),
('a2222222-2222-4222-a222-222222222222', 'Super Affiliate VIP Bonus Rate', 'percentage', 25.00, true)
ON CONFLICT (id) DO NOTHING;

-- Seed System Settings
INSERT INTO system_settings (key, value, description) VALUES
('general_settings', '{"site_name": "Affiliate Cloud SaaS", "support_email": "support@affiliatesaas.com", "currency": "USD"}', 'Global system configuration'),
('commission_settings', '{"default_rate": 15.0, "auto_approve_threshold": 100.0, "payout_schedule": "monthly"}', 'Global commission defaults')
ON CONFLICT (key) DO NOTHING;

-- Seed Users (Password for all: password123)
-- Hash: $2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO

-- 1. Super Admin
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b1111111-1111-4111-a111-111111111111', 'superadmin@affiliate.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '11111111-1111-4111-a111-111111111111', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('b1111111-1111-4111-a111-111111111111', 'Super', 'Admin', 'Enterprise HQ', '+1 (555) 000-0001')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Operations Admin
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b2222222-2222-4222-a222-222222222222', 'admin@affiliate.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '22222222-2222-4222-a222-222222222222', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('b2222222-2222-4222-a222-222222222222', 'Operations', 'Admin', 'Enterprise Ops', '+1 (555) 000-0002')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Super Affiliate Team Leader
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b3333333-3333-4333-a333-333333333333', 'superaffiliate@affiliate.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '33333333-3333-4333-a333-333333333333', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('b3333333-3333-4333-a333-333333333333', 'Sarah', 'LeadPartner', 'Growth Labs Inc', '+1 (555) 000-0003')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Standard Affiliate 1
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified, parent_affiliate_id) VALUES
('b4444444-4444-4444-a444-444444444444', 'affiliate@affiliate.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '44444444-4444-4444-a444-444444444444', 'active', true, 'b3333333-3333-4333-a333-333333333333')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('b4444444-4444-4444-a444-444444444444', 'Alex', 'Promoter', 'Digital Media LLC', '+1 (555) 000-0004')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Standard Affiliate 2
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified, parent_affiliate_id) VALUES
('b5555555-5555-4555-a555-555555555555', 'affiliate2@affiliate.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '44444444-4444-4444-a444-444444444444', 'active', true, 'b3333333-3333-4333-a333-333333333333')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('b5555555-5555-4555-a555-555555555555', 'Jordan', 'Marketer', 'Nexus Marketing', '+1 (555) 000-0005')
ON CONFLICT (user_id) DO NOTHING;

-- Repair existing demo accounts created with the previous invalid placeholder hash.
-- Password for these demo accounts: password123
UPDATE users
SET password_hash = '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO'
WHERE email IN ('superadmin@affiliate.com', 'admin@affiliate.com', 'superaffiliate@affiliate.com', 'affiliate@affiliate.com', 'affiliate2@affiliate.com');

-- Seed Affiliate Links
INSERT INTO affiliate_links (id, user_id, referral_code, target_url, title, click_count) VALUES
('c1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'AFF-HJ72KS', 'https://veggieradiance.com/', 'Primary Growth Campaign', 42),
('c2222222-2222-4222-a222-222222222222', 'b3333333-3333-4333-a333-333333333333', 'SUP-9982KS', 'https://veggieradiance.com/', 'Super Affiliate VIP Link', 128)
ON CONFLICT (referral_code) DO NOTHING;

-- Seed Sample Click Events
INSERT INTO click_events (id, affiliate_link_id, referral_code, ip_address, user_agent, referrer_url) VALUES
('d1111111-1111-4111-a111-111111111111', 'c1111111-1111-4111-a111-111111111111', 'AFF-HJ72KS', '192.168.1.10', 'Mozilla/5.0 Chrome/120.0', 'https://google.com'),
('d2222222-2222-4222-a222-222222222222', 'c1111111-1111-4111-a111-111111111111', 'AFF-HJ72KS', '192.168.1.12', 'Mozilla/5.0 Safari/17.0', 'https://twitter.com')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Conversion Events
INSERT INTO conversion_events (id, click_id, affiliate_id, order_id, amount, currency, status) VALUES
('e1111111-1111-4111-a111-111111111111', 'd1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'ORD-98214', 250.00, 'USD', 'completed'),
('e2222222-2222-4222-a222-222222222222', 'd2222222-2222-4222-a222-222222222222', 'b4444444-4444-4444-a444-444444444444', 'ORD-98215', 500.00, 'USD', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Commissions
INSERT INTO commissions (id, affiliate_id, conversion_id, rule_id, amount, rate, status) VALUES
('f1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'e1111111-1111-4111-a111-111111111111', 'a1111111-1111-4111-a111-111111111111', 37.50, 15.00, 'paid'),
('f2222222-2222-4222-a222-222222222222', 'b4444444-4444-4444-a444-444444444444', 'e2222222-2222-4222-a222-222222222222', 'a1111111-1111-4111-a111-111111111111', 75.00, 15.00, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Seed Audit Logs (Using valid hex UUID: f9999999-9999-4999-a999-999999999999)
INSERT INTO audit_logs (id, actor_id, target_user_id, action, changes_json, ip_address) VALUES
('f9999999-9999-4999-a999-999999999999', 'b1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'USER_STATUS_CHANGE_TO_ACTIVE', '{"previousStatus": "pending", "newStatus": "active"}', '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

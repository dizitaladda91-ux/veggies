-- =========================================================
-- Enterprise Affiliate Management System Database Schema
-- Supabase / PostgreSQL DDL Script
-- UUID v4 Primary Keys, Foreign Keys, Indexes, Soft Deletes
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  parent_affiliate_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Super affiliate parent relationship
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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'processing', 'cancelled', 'failed', 'under_review')),
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

-- 15. PAYMENT GATEWAY TABLES
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_order_id VARCHAR(100) NOT NULL UNIQUE,
  gateway_payment_id VARCHAR(100) UNIQUE,
  affiliate_id UUID NOT NULL REFERENCES users(id),
  click_id UUID NOT NULL REFERENCES click_events(id),
  referral_code VARCHAR(50) NOT NULL,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount NUMERIC(12,2) NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL CHECK (status IN ('CREATED','PENDING','SUCCESS','FAILED','REFUNDED','PARTIALLY_REFUNDED','CANCELLED')),
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID REFERENCES payments(id) ON DELETE CASCADE, event_type VARCHAR(80) NOT NULL, payload JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS webhook_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), gateway_event_id VARCHAR(100) NOT NULL UNIQUE, event_type VARCHAR(80) NOT NULL, payload JSONB NOT NULL, status VARCHAR(20) NOT NULL, processed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS refunds (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID NOT NULL REFERENCES payments(id), gateway_refund_id VARCHAR(100) NOT NULL UNIQUE, amount NUMERIC(12,2) NOT NULL, status VARCHAR(30) NOT NULL, gateway_response JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS affiliate_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code VARCHAR(50) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  order_id VARCHAR(100) NOT NULL UNIQUE,
  conversion_id UUID REFERENCES conversion_events(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (referral_code, customer_email)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_coupon_redemptions_customer ON affiliate_coupon_redemptions(customer_email);
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

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_click_events_code ON click_events(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);

-- Financial operations modules
CREATE TABLE IF NOT EXISTS affiliate_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id __USER_ID_TYPE__ NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_holder_name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(18) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch_name VARCHAR(100),
  upi_id VARCHAR(100),
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('SAVINGS', 'CURRENT')),
  document_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by __USER_ID_TYPE__ REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE affiliate_bank_accounts ADD COLUMN IF NOT EXISTS document_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_bank_account_per_user ON affiliate_bank_accounts(user_id) WHERE is_default = TRUE AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id __USER_ID_TYPE__ NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifetime_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  user_id __USER_ID_TYPE__ NOT NULL REFERENCES users(id),
  type VARCHAR(40) NOT NULL,
  reference_type VARCHAR(50),
  reference_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  opening_balance NUMERIC(12,2) NOT NULL,
  closing_balance NUMERIC(12,2) NOT NULL,
  description VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  created_by __USER_ID_TYPE__ REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS withdrawal_number VARCHAR(50);
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES affiliate_bank_accounts(id);
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS approved_by __USER_ID_TYPE__ REFERENCES users(id);
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS failure_reason TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdraw_requests_number ON withdraw_requests(withdrawal_number) WHERE withdrawal_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_number VARCHAR(50) NOT NULL UNIQUE,
  withdraw_request_id __WITHDRAW_REQUEST_ID_TYPE__ NOT NULL UNIQUE REFERENCES withdraw_requests(id),
  user_id __USER_ID_TYPE__ NOT NULL REFERENCES users(id),
  bank_account_id UUID REFERENCES affiliate_bank_accounts(id),
  amount NUMERIC(12,2) NOT NULL,
  gateway VARCHAR(30) NOT NULL,
  gateway_reference VARCHAR(255),
  transaction_reference VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  remarks TEXT,
  failure_reason TEXT,
  processed_by __USER_ID_TYPE__ REFERENCES users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status_created ON payouts(status, created_at DESC);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approved_by __USER_ID_TYPE__ REFERENCES users(id);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT;

-- Affiliate-link classification for the two distinct business journeys.
-- Existing links remain SHOPPING links; only system-managed links participate
-- in the partial unique index so historical custom campaign links are kept.
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS link_type VARCHAR(20) NOT NULL DEFAULT 'SHOPPING';
ALTER TABLE affiliate_links ADD COLUMN IF NOT EXISTS is_system_link BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS link_type VARCHAR(20);
UPDATE affiliate_links
SET is_system_link = TRUE
WHERE title = 'Default Referral Link' AND deleted_at IS NULL AND is_system_link = FALSE;
WITH ranked_system_links AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, link_type ORDER BY created_at, id) AS row_number
  FROM affiliate_links
  WHERE is_system_link = TRUE AND deleted_at IS NULL
)
UPDATE affiliate_links al
SET is_system_link = FALSE
FROM ranked_system_links ranked
WHERE al.id = ranked.id AND ranked.row_number > 1;
UPDATE click_events ce
SET link_type = al.link_type
FROM affiliate_links al
WHERE ce.affiliate_link_id = al.id AND ce.link_type IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_links_link_type_check') THEN
    ALTER TABLE affiliate_links ADD CONSTRAINT affiliate_links_link_type_check CHECK (link_type IN ('SHOPPING', 'RECRUITMENT'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_type ON affiliate_links(user_id, link_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_click_events_link_type ON click_events(link_type, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_system_link_per_type
  ON affiliate_links(user_id, link_type)
  WHERE is_system_link = TRUE AND deleted_at IS NULL;

-- Configurable commission slabs and a consistent money basis. `amount` stays
-- as the legacy eligible/net value for backwards compatibility.
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS event_type VARCHAR(30) NOT NULL DEFAULT 'generic';
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS minimum_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS maximum_amount NUMERIC(12,2);
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS commission_base VARCHAR(20) NOT NULL DEFAULT 'NET';
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2);
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS eligible_amount NUMERIC(12,2);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS commission_type VARCHAR(30) NOT NULL DEFAULT 'DIRECT';
UPDATE conversion_events SET gross_amount=amount, eligible_amount=amount WHERE gross_amount IS NULL OR eligible_amount IS NULL;
-- Veggie sends its immutable MongoDB order ID to the conversion endpoint.
-- This protects the affiliate ledger if the storefront retries a webhook or
-- its conversion-sync worker runs more than once.
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_events_order_id_unique
  ON conversion_events(order_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_commission_rules_matching ON commission_rules(event_type, is_active, minimum_amount, maximum_amount) WHERE deleted_at IS NULL;
INSERT INTO commission_rules (name, type, value, event_type, minimum_amount, maximum_amount, commission_base, is_active)
SELECT 'Shopping slab 0-1000', 'percentage', 10, 'shopping', 0, 1000, 'NET', TRUE
WHERE NOT EXISTS (SELECT 1 FROM commission_rules WHERE name='Shopping slab 0-1000' AND deleted_at IS NULL);
INSERT INTO commission_rules (name, type, value, event_type, minimum_amount, maximum_amount, commission_base, is_active)
SELECT 'Shopping slab 1000.01-1500', 'percentage', 15, 'shopping', 1000.01, 1500, 'NET', TRUE
WHERE NOT EXISTS (SELECT 1 FROM commission_rules WHERE name='Shopping slab 1000.01-1500' AND deleted_at IS NULL);
INSERT INTO commission_rules (name, type, value, event_type, minimum_amount, maximum_amount, commission_base, is_active)
SELECT 'Shopping slab 1500.01+', 'percentage', 20, 'shopping', 1500.01, NULL, 'NET', TRUE
WHERE NOT EXISTS (SELECT 1 FROM commission_rules WHERE name='Shopping slab 1500.01+' AND deleted_at IS NULL);

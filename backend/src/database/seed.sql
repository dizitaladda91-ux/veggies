-- Required access-control master data. This intentionally contains no users,
-- campaigns, financial data, analytics, or application settings.
INSERT INTO roles (id, name, description) VALUES
  ('11111111-1111-4111-a111-111111111111', 'super_admin', 'Full system access and administrative management'),
  ('22222222-2222-4222-a222-222222222222', 'admin', 'Manages affiliates, approvals, and commission rules'),
  ('33333333-3333-4333-a333-333333333333', 'super_affiliate', 'Team leader managing multi-level sub-affiliates'),
  ('44444444-4444-4444-a444-444444444444', 'affiliate', 'Standard referral affiliate')
ON CONFLICT (name) DO NOTHING;

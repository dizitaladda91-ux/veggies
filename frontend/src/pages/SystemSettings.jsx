import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';

export const SystemSettings = () => {
  const [siteName, setSiteName] = useState('Affiliate Cloud SaaS');
  const [supportEmail, setSupportEmail] = useState('support@affiliatecloud.com');
  const [defaultCommission, setDefaultCommission] = useState(15);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);

  const { showSuccess } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('System settings updated successfully!');
    }, 500);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Configure global platform settings, default rates, and email defaults.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Platform Title / Brand Name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />
          <Input
            label="Support Email Address"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            required
          />
          <div className="form-group">
            <label className="form-label">Platform Currency</label>
            <select
              className="form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </div>
          <Input
            label="Default Commission Rate (%)"
            type="number"
            value={defaultCommission}
            onChange={(e) => setDefaultCommission(e.target.value)}
            required
          />

          <div className="flex justify-end" style={{ marginTop: '1.5rem' }}>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

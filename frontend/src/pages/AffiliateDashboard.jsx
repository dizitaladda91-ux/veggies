import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { fetchDashboardOverview } from '../services/affiliateService';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';
import { MousePointer, TrendingUp, DollarSign, Clock, Copy, ExternalLink } from 'lucide-react';

export const AffiliateDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useNotification();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchDashboardOverview();
        setData(res);
      } catch (err) {
        console.error('Error fetching affiliate dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
    const refreshInterval = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  const stats = data?.stats || {};
  const links = data?.links || [];
  const primaryLink = links[0] || {};
  const refCode = primaryLink.referral_code || 'AFF-HJ72KS';
  const referralBaseUrl = (import.meta.env.VITE_REFERRAL_BASE_URL || 'https://affiliation.veggieradiance.com').replace(/\/$/, '');
  const refUrl = `${referralBaseUrl}/ref/${refCode}`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'order_id',
      render: (row) => row.order_id || 'ORD-98214',
    },
    {
      header: 'Order Amount',
      accessor: 'order_amount',
      render: (row) => formatCurrency(row.order_amount || 100),
    },
    {
      header: 'Commission Amount',
      accessor: 'amount',
      render: (row) => formatCurrency(row.amount),
    },
    {
      header: 'Source',
      accessor: 'commission_type',
      render: (row) => row.commission_type === 'TEAM' ? 'Team' : 'Direct',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Affiliate Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Track your active link clicks, conversions, and direct referral earnings.
        </p>
      </div>

      {/* Referral Link & Code Banner */}
      <Card style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-light) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Your Unique Referral Code
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>{refCode}</span>
              <Button variant="secondary" onClick={() => copyToClipboard(refCode, 'Referral code')}>
                <Copy size={16} /> Copy Code
              </Button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Your Unique Referral Link
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={refUrl}
                className="form-input"
                style={{ flex: 1, fontSize: '0.875rem' }}
              />
              <Button onClick={() => copyToClipboard(refUrl, 'Referral URL')}>
                <Copy size={16} /> Copy Link
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Clicks"
          value={loading ? '...' : stats.totalClicks || 0}
          icon={MousePointer}
          footerText="Unique visitor clicks"
        />
        <StatCard
          title="Conversions"
          value={loading ? '...' : stats.totalConversions || 0}
          icon={TrendingUp}
          footerText="Successful sales"
        />
        <StatCard
          title="Approved / Paid Earnings"
          value={loading ? '...' : formatCurrency(stats.totalPaidEarnings || 0)}
          icon={DollarSign}
          footerText="Disbursed earnings"
        />
        <StatCard
          title="Pending Earnings"
          value={loading ? '...' : formatCurrency(stats.totalPendingEarnings || 0)}
          icon={Clock}
          footerText="Awaiting payout processing"
        />
      </div>

      <Card title="Recent Commissions">
        <Table columns={columns} data={data?.recentCommissions || []} loading={loading} emptyMessage="No commissions recorded yet." />
      </Card>
    </div>
  );
};

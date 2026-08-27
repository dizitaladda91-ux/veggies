import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { fetchDashboardOverview } from '../services/affiliateService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Users, UserCheck, DollarSign, ShieldAlert } from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchDashboardOverview();
        setData(res);
      } catch (err) {
        console.error('Error fetching admin dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const stats = data?.stats || {};
  const recentUsers = data?.recentUsers || [];

  const columns = [
    {
      header: 'Affiliate',
      accessor: 'email',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role_name',
      render: (row) => <Badge status={row.role_name}>{row.role_name.replace('_', ' ')}</Badge>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Joined Date',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Operations Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage affiliate accounts, commission approvals, and growth tracking.
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Affiliates"
          value={loading ? '...' : stats.totalAffiliates || 0}
          icon={Users}
          footerText="Registered affiliate accounts"
        />
        <StatCard
          title="Super Affiliates"
          value={loading ? '...' : stats.totalSuperAffiliates || 0}
          icon={UserCheck}
          footerText="Team managers & influencers"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : stats.pendingApprovals || 0}
          icon={ShieldAlert}
          footerText="Requires admin review"
        />
        <StatCard
          title="Revenue Generated"
          value={loading ? '...' : formatCurrency(stats.totalRevenue || 0)}
          icon={DollarSign}
          footerText="Total driven by partners"
        />
      </div>

      <Card title="Recent Registered Partners">
        <Table columns={columns} data={recentUsers} loading={loading} />
      </Card>
    </div>
  );
};

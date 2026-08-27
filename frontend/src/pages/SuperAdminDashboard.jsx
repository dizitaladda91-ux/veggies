import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { fetchDashboardOverview } from '../services/affiliateService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Users, UserCheck, DollarSign, TrendingUp, ShieldAlert, Award } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchDashboardOverview();
        setData(res);
      } catch (err) {
        console.error('Error fetching dashboard', err);
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
      header: 'User',
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Super Admin Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Global metrics, user approvals, system revenue, and platform audit logs.
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Users"
          value={loading ? '...' : stats.totalUsers || 0}
          icon={Users}
          footerText="Registered accounts across all roles"
        />
        <StatCard
          title="Active Affiliates"
          value={loading ? '...' : stats.totalAffiliates || 0}
          icon={UserCheck}
          footerText="Active referral publishers"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : stats.pendingApprovals || 0}
          icon={ShieldAlert}
          footerText="Accounts requiring verification"
        />
        <StatCard
          title="Total Commission Paid"
          value={loading ? '...' : formatCurrency(stats.totalCommissionPaid || 0)}
          icon={DollarSign}
          footerText="Paid affiliate payouts"
        />
      </div>

      <Card title="Recently Registered Users" subtitle="Latest accounts registered in the system">
        <Table columns={columns} data={recentUsers} loading={loading} />
      </Card>
    </div>
  );
};

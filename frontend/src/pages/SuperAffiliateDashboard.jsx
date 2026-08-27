import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { fetchDashboardOverview } from '../services/affiliateService';
import { fetchTeam } from '../services/referralService';
import { formatCurrency } from '../utils/formatters';
import { Users, MousePointer, DollarSign, TrendingUp } from 'lucide-react';

export const SuperAffiliateDashboard = () => {
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [overviewRes, teamRes] = await Promise.all([fetchDashboardOverview(), fetchTeam()]);
        setData(overviewRes);
        setTeam(teamRes?.items || []);
      } catch (err) {
        console.error('Error loading team dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const stats = data?.stats || {};

  const teamColumns = [
    {
      header: 'Team Member',
      accessor: 'email',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Company',
      accessor: 'company',
      render: (row) => row.company || 'Direct',
    },
    {
      header: 'Conversions',
      accessor: 'total_conversions',
    },
    {
      header: 'Earnings Driven',
      accessor: 'total_earnings',
      render: (row) => formatCurrency(row.total_earnings),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Super Affiliate Command Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Track your team network performance, referral clicks, and multi-tier revenue.
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Team Members"
          value={loading ? '...' : team.length}
          icon={Users}
          footerText="Sub-affiliates in your team"
        />
        <StatCard
          title="Total Clicks"
          value={loading ? '...' : stats.totalClicks || 0}
          icon={MousePointer}
          footerText="Traffic driven by your link"
        />
        <StatCard
          title="Conversions"
          value={loading ? '...' : stats.totalConversions || 0}
          icon={TrendingUp}
          footerText="Successful referrals"
        />
        <StatCard
          title="Paid Earnings"
          value={loading ? '...' : formatCurrency(stats.totalPaidEarnings || 0)}
          icon={DollarSign}
          footerText="Ready for withdrawal"
        />
      </div>

      <Card title="My Sub-Affiliate Team Performance">
        <Table columns={teamColumns} data={team} loading={loading} emptyMessage="No team members invited yet." />
      </Card>
    </div>
  );
};

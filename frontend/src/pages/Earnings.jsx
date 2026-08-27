import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { fetchEarnings } from '../services/affiliateService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';

export const Earnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const res = await fetchEarnings();
        setData(res);
      } catch (err) {
        console.error('Failed to load earnings', err);
      } finally {
        setLoading(false);
      }
    };
    loadEarnings();
  }, []);

  const columns = [
    {
      header: 'Commission ID',
      accessor: 'id',
      render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.id.slice(0, 8)}...</span>,
    },
    {
      header: 'Order Reference',
      accessor: 'order_id',
      render: (row) => row.order_id || 'ORD-REF-1092',
    },
    {
      header: 'Commission Rate',
      accessor: 'rate',
      render: (row) => `${row.rate}%`,
    },
    {
      header: 'Source',
      accessor: 'commission_type',
      render: (row) => row.commission_type === 'TEAM' ? 'Team referral' : 'Direct referral',
    },
    {
      header: 'Amount Earned',
      accessor: 'amount',
      render: (row) => formatCurrency(row.amount),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Date Created',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Earnings & Payout Ledger</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Detailed record of commission payouts, pending balances, and transaction history.
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Lifetime Earnings"
          value={loading ? '...' : formatCurrency(data?.totalEarnings || 0)}
          icon={DollarSign}
          footerText="Gross commission revenue"
        />
        <StatCard
          title="Paid Out"
          value={loading ? '...' : formatCurrency(data?.paidEarnings || 0)}
          icon={CheckCircle}
          footerText="Disbursed to your account"
        />
        <StatCard
          title="Pending Approval"
          value={loading ? '...' : formatCurrency(data?.pendingEarnings || 0)}
          icon={Clock}
          footerText="Awaiting payout clearance"
        />
      </div>

      <Card title="Commission History">
        <Table columns={columns} data={data?.commissions || []} loading={loading} emptyMessage="No earnings records yet." />
      </Card>
    </div>
  );
};

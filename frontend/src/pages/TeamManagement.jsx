import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { fetchTeam } from '../services/referralService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNotification } from '../hooks/useNotification';
import { UserPlus, Copy } from 'lucide-react';

export const TeamManagement = () => {
  const [team, setTeam] = useState([]);
  const [stats, setStats] = useState(null);
  const [recruitmentLink, setRecruitmentLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useNotification();

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const [res, links] = await Promise.all([fetchTeam(), fetchAffiliateLinks()]);
        setTeam(res.items || []); setStats(res.stats || null);
        setRecruitmentLink((links || []).find((link) => link.link_type === 'RECRUITMENT') || null);
      } catch (err) {
        console.error('Error fetching team', err);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, []);

  const copyInviteLink = () => {
    const inviteUrl = recruitmentLink?.target_url;
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    showSuccess('Team invite link copied to clipboard!');
  };

  const columns = [
    {
      header: 'Sub-Affiliate Name',
      accessor: 'email',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Company / Brand',
      accessor: 'company',
      render: (row) => row.company || 'Independent',
    },
    {
      header: 'Sales Converted',
      accessor: 'total_conversions',
    },
    {
      header: 'Revenue Driven',
      accessor: 'total_earnings',
      render: (row) => formatCurrency(row.total_earnings),
    },
    {
      header: 'Joined Date',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Super Affiliate Team Network</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Invite sub-affiliates, track performance metrics, and monitor team earnings.
          </p>
        </div>
        <Button onClick={copyInviteLink} disabled={!recruitmentLink} icon={UserPlus}>
          Copy Team Invite Link
        </Button>
      </div>

      {stats && <Card style={{ marginBottom: '1rem' }}><strong>{stats.totalTeamMembers} team members</strong><p style={{ margin: '.4rem 0 0', color: 'var(--text-muted)' }}>{stats.totalAffiliates} Affiliates · {stats.totalSuperAffiliates} Super Affiliates · {stats.activeMembers} active · Team rate: {stats.currentRecruitmentCommissionRate}%</p></Card>}

      <Card>
        <Table columns={columns} data={team} loading={loading} emptyMessage="You haven't recruited any sub-affiliates yet." />
      </Card>
    </div>
  );
};

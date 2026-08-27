import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { fetchAuditLogs } from '../services/adminService';
import { formatDate } from '../utils/formatters';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetchAuditLogs({ limit: 50 });
        setLogs(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const columns = [
    {
      header: 'Actor',
      accessor: 'actor_email',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row.actor_first_name ? `${row.actor_first_name} ${row.actor_last_name || ''}` : 'System Admin'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.actor_email}</div>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      accessor: 'action',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{row.action}</span>,
    },
    {
      header: 'Target User',
      accessor: 'target_email',
      render: (row) => row.target_email || '—',
    },
    {
      header: 'IP Address',
      accessor: 'ip_address',
      render: (row) => row.ip_address || '127.0.0.1',
    },
    {
      header: 'Timestamp',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Enterprise Security & Audit Trail</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Immutably logged administrative actions, account updates, and security events.
        </p>
      </div>

      <Card>
        <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit logs recorded." />
      </Card>
    </div>
  );
};

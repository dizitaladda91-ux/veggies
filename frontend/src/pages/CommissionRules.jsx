import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { fetchCommissionRules, createCommissionRule, settleMaturedCommissions } from '../services/referralService';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/formatters';
import { Plus } from 'lucide-react';

export const CommissionRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'percentage', value: 15 });
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);

  const { showSuccess, showError } = useNotification();

  const loadRules = async () => {
    try {
      const data = await fetchCommissionRules();
      setRules(data);
    } catch (err) {
      showError('Failed to load commission rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCommissionRule(formData);
      showSuccess('Commission rule created successfully');
      setModalOpen(false);
      setFormData({ name: '', type: 'percentage', value: 15 });
      loadRules();
    } catch (err) {
      showError(err.message || 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const handleSettlement = async () => {
    setSettling(true);
    try {
      const result = await settleMaturedCommissions();
      showSuccess(`${result.settledCount || 0} matured commissions moved to affiliate wallets.`);
    } catch (err) {
      showError(err.message || 'Unable to settle matured commissions');
    } finally {
      setSettling(false);
    }
  };

  const columns = [
    {
      header: 'Rule Name',
      accessor: 'name',
      render: (row) => <strong style={{ fontWeight: 700 }}>{row.name}</strong>,
    },
    {
      header: 'Commission Type',
      accessor: 'type',
      render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.type}</span>,
    },
    {
      header: 'Rate / Value',
      accessor: 'value',
      render: (row) => `${row.value}${row.type === 'percentage' ? '%' : ' ₹'}`,
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => <Badge status={row.is_active ? 'active' : 'suspended'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Created Date',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Commission Rate Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure global percentage or flat payouts awarded per conversion.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSettlement} loading={settling}>
            Settle Matured Commissions
          </Button>
          <Button onClick={() => setModalOpen(true)} icon={Plus}>
            New Commission Rule
          </Button>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={rules} loading={loading} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Commission Rule">
        <form onSubmit={handleCreateRule}>
          <Input
            label="Rule Name"
            placeholder="e.g. VIP Affiliate 20% Rate"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="form-group">
            <label className="form-label">Commission Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <Input
            label="Value / Amount"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

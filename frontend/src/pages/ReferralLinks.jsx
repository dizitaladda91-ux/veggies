import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { fetchAffiliateLinks, createAffiliateLink } from '../services/affiliateService';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/formatters';
import { Plus, Copy, ExternalLink } from 'lucide-react';

export const ReferralLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [saving, setSaving] = useState(false);

  const { showSuccess, showError } = useNotification();

  const loadLinks = async () => {
    try {
      const data = await fetchAffiliateLinks();
      setLinks(data);
    } catch (err) {
      showError('Failed to fetch referral links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAffiliateLink({ title, targetUrl, referralCode });
      showSuccess('Campaign link generated successfully');
      setModalOpen(false);
      setTitle('');
      setTargetUrl('');
      setReferralCode('');
      loadLinks();
    } catch (err) {
      showError(err.message || 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (link) => {
    // Use the public portal even if an administrator happens to generate a
    // link from a local development machine.
    const referralBaseUrl = (import.meta.env.VITE_REFERRAL_BASE_URL || 'https://affiliation.veggieradiance.com').replace(/\/$/, '');
    const fullUrl = link.link_type === 'RECRUITMENT' ? link.target_url : `${referralBaseUrl}/ref/${link.referral_code}`;
    navigator.clipboard.writeText(fullUrl);
    showSuccess('Referral URL copied — customers using it get 10% off.');
  };

  const columns = [
    {
      header: 'Campaign Title',
      accessor: 'title',
      render: (row) => <strong style={{ fontWeight: 700 }}>{row.title}</strong>,
    },
    { header: 'Type', accessor: 'link_type', render: (row) => row.link_type === 'RECRUITMENT' ? 'Recruitment' : 'Shopping' },
    {
      header: 'Referral Code',
      accessor: 'referral_code',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.referral_code}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'tracked_clicks',
      render: (row) => row.tracked_clicks ?? row.click_count ?? 0,
    },
    {
      header: 'Conversions',
      accessor: 'conversion_count',
      render: (row) => row.conversion_count ?? 0,
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => copyLink(row)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
            <Copy size={14} /> Copy URL
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Referral Link Generator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Create tracking links for your campaigns. Customers who purchase through a valid link receive 10% off.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>
          Generate New Link
        </Button>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)' }}>
        <strong style={{ color: '#166534' }}>Standard affiliate commission</strong>
        <p style={{ color: '#166534', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
          Up to ₹1,000: 10% · ₹1,001–₹1,500: 15% · ₹1,501 and above: 20%
        </p>
      </div>

      <Card>
        <Table columns={columns} data={links} loading={loading} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Custom Referral Link">
        <form onSubmit={handleCreateLink}>
          <Input
            label="Campaign Title"
            placeholder="e.g. YouTube Tech Review Campaign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Your Referral Name (Optional)"
            placeholder="e.g. Divyanshu"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            maxLength={50}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '-0.5rem 0 1rem' }}>
            Share it as /ref/Divyanshu. Spaces become hyphens; this name must be unique. Customers using it still receive 10% off.
          </p>
          <Input
            label="Target Destination URL (Optional)"
            placeholder="https://yourdomain.com/product/special-offer"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Generate Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

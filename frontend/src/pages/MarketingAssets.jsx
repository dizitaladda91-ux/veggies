import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { fetchMarketingAssets, deleteMarketingAsset } from '../services/marketingAssetService';
import { ROLES } from '../constants/roles';

export const MarketingAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role_name);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await fetchMarketingAssets();
      setAssets(data || []);
    } catch (err) {
      showError('Failed to load marketing banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleCopyCode = (id, text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    showSuccess(`${type === 'embed' ? 'HTML Embed Code' : 'Direct Link'} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketing asset?')) return;
    try {
      await deleteMarketingAsset(id);
      showSuccess('Banner removed successfully.');
      loadAssets();
    } catch (err) {
      showError('Failed to delete asset.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Marketing Assets & Banner Library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Promotional banners, social media graphics, and embeds pre-configured with your unique referral tracking link.
        </p>
      </div>

      {loading ? (
        <Card><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading promotional banners...</div></Card>
      ) : assets.length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No promotional assets available yet.</div></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {assets.map((asset) => (
            <Card key={asset.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                    {asset.dimensions || '728x90'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {asset.asset_type || 'BANNER'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{asset.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{asset.description}</p>

                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', marginBottom: '1rem', overflow: 'hidden' }}>
                  <img
                    src={asset.image_url}
                    alt={asset.title}
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>HTML Embed Code:</label>
                  <textarea
                    readOnly
                    rows={2}
                    value={asset.embedHtml}
                    style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'monospace', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #1e293b)', color: 'var(--text-main, #f8fafc)', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => handleCopyCode(asset.id, asset.embedHtml, 'embed')}
                  >
                    {copiedId === `${asset.id}-embed` ? '✓ Copied Embed' : '📋 Copy Embed Code'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyCode(asset.id, asset.referralUrl, 'link')}
                  >
                    {copiedId === `${asset.id}-link` ? '✓ Copied Link' : '🔗 Copy Link'}
                  </Button>
                  {isAdmin && (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(asset.id)}>
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

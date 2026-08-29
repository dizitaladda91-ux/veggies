import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useNotification } from '../hooks/useNotification';
import { Percent, Search, CheckCircle2, XCircle, Clock, DollarSign, Filter, Sparkles, UserCheck, Zap, History } from 'lucide-react';

export const AdminCommissions = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/commissions/admin/all');
      setItems(res.data.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusUpdate = async (commissionId, newStatus) => {
    setProcessingId(commissionId);
    try {
      await api.patch(`/commissions/${commissionId}/status`, { status: newStatus });
      showSuccess(
        newStatus === 'approved'
          ? 'Commission APPROVED! Wallet balance credited to affiliate. ✅'
          : `Commission status updated to ${newStatus.toUpperCase()}`
      );
      load();
    } catch (err) {
      showError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSettleAllNow = async () => {
    const pendingList = items.filter((i) => (i.status || '').toUpperCase() === 'PENDING');
    if (pendingList.length === 0) {
      showError('No pending commissions to settle.');
      return;
    }

    if (!window.confirm(`Are you sure you want to settle ALL ${pendingList.length} pending commissions now?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      let count = 0;
      for (const item of pendingList) {
        await api.patch(`/commissions/${item.id}/status`, { status: 'approved' });
        count++;
      }
      showSuccess(`Successfully settled ${count} commissions and credited wallet balances! ⚡`);
      load();
    } catch (err) {
      showError('Failed to settle all commissions.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSettleMatured = async () => {
    setBulkProcessing(true);
    try {
      const res = await api.post('/commissions/auto-settle', { holdDays: 7 });
      const { settledCount, totalSettledAmount } = res.data.data || {};
      showSuccess(
        settledCount > 0
          ? `Auto-settled ${settledCount} commissions (>7 Days) totaling ₹${totalSettledAmount.toFixed(2)}! ⌛`
          : 'No matured pending commissions (>7 Days) found to settle.'
      );
      load();
    } catch (err) {
      showError('Failed to run auto-settlement.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const itemStatus = (item.status || '').toUpperCase();
    const matchesTab = activeTab === 'ALL' || itemStatus === activeTab;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.order_id && item.order_id.toLowerCase().includes(query)) ||
      (item.amount && String(item.amount).includes(query));
    return matchesTab && matchesSearch;
  });

  const counts = {
    ALL: items.length,
    PENDING: items.filter((i) => (i.status || '').toUpperCase() === 'PENDING').length,
    APPROVED: items.filter((i) => (i.status || '').toUpperCase() === 'APPROVED').length,
    REJECTED: items.filter((i) => (i.status || '').toUpperCase() === 'REJECTED').length,
    PAID: items.filter((i) => (i.status || '').toUpperCase() === 'PAID').length,
  };

  const pendingTotal = items
    .filter((i) => (i.status || '').toUpperCase() === 'PENDING')
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  const approvedTotal = items
    .filter((i) => ['APPROVED', 'PAID'].includes((i.status || '').toUpperCase()))
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  return (
    <div className="admin-commissions-page p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Percent className="w-8 h-8 text-emerald-400" /> Pending Commission Approvals
          </h1>
          <p className="text-emerald-200/70 text-sm mt-1">
            Review affiliate sales, approve pending commissions, and credit wallet balances instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            loading={bulkProcessing}
            onClick={handleSettleAllNow}
            className="btn-primary text-xs py-2.5 px-4 font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-lg"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" /> ⚡ Settle ALL Pending Now
          </Button>

          <Button
            loading={bulkProcessing}
            onClick={handleSettleMatured}
            className="btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-emerald-400" /> ⌛ Settle Matured (&gt;7 Days)
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-emerald-950/50 p-1.5 rounded-xl border border-emerald-500/20">
          {['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              {tab} ({counts[tab] || 0})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
          <input
            type="text"
            placeholder="Search order ID, affiliate, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 w-full bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2.5 rounded-xl"
          />
        </div>
      </div>

      {/* Commissions Grid */}
      <Card className="glass-card p-6 border-emerald-500/20">
        {loading ? (
          <div className="text-center py-12 text-emerald-300 animate-pulse">Loading commissions list...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-emerald-200/50">
            No commissions found for tab "{activeTab}".
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const statusUpper = (item.status || '').toUpperCase();
              return (
                <article
                  key={item.id}
                  className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 hover:border-emerald-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left Column: Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        Order #{item.order_id || 'N/A'}
                      </span>
                      <Badge status={item.status}>{item.status}</Badge>
                      <span className="text-xs text-emerald-300/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-emerald-400 font-semibold block">Affiliate</span>
                        <span className="text-white font-medium">
                          {item.first_name || 'Affiliate'} ({item.email})
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold block">Order Amount</span>
                        <span className="text-white font-mono">₹{parseFloat(item.order_amount || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold block">Commission Rate</span>
                        <span className="text-white font-mono">{parseFloat(item.rate || 0)}%</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold block">Commission Earned</span>
                        <span className="text-emerald-300 font-extrabold text-sm">
                          ₹{parseFloat(item.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-3 border-t lg:border-t-0 border-emerald-500/20 pt-4 lg:pt-0">
                    {statusUpper === 'PENDING' && (
                      <>
                        <Button
                          loading={processingId === item.id}
                          onClick={() => handleStatusUpdate(item.id, 'approved')}
                          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Credit Wallet
                        </Button>
                        <Button
                          loading={processingId === item.id}
                          onClick={() => handleStatusUpdate(item.id, 'rejected')}
                          className="btn-danger text-xs py-2.5 px-3 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </>
                    )}

                    {statusUpper === 'APPROVED' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approved & Credited
                      </span>
                    )}

                    {statusUpper === 'PAID' && (
                      <span className="text-xs text-lime-400 font-semibold flex items-center gap-1 bg-lime-500/10 px-3 py-1.5 rounded-lg border border-lime-500/20">
                        <DollarSign className="w-4 h-4 text-lime-400" /> Payout Settled
                      </span>
                    )}

                    {statusUpper === 'REJECTED' && (
                      <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                        <XCircle className="w-4 h-4 text-rose-400" /> Rejected
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

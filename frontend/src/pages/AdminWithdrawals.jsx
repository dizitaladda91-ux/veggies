import React, { useEffect, useState } from 'react';
import { Filter, X, Copy, Check, Send, CheckCircle2, DollarSign } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  fetchAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  fetchPayouts,
  createPayout,
  approvePayout,
  updatePayout,
  exportWithdrawalsCsv,
  exportPayoutsCsv,
  createRazorpayPayoutOrder,
  completeRazorpayPayout,
} from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNotification } from '../hooks/useNotification';

const PAGE_SIZE = 10;
const withdrawalStatuses = ['', 'pending', 'approved', 'rejected', 'cancelled'];
const payoutStatuses = ['', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'];

const Paging = ({ pagination, onChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="financial-paging">
      <span>
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
      </span>
      <div>
        <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={!pagination.hasNextPage && pagination.page >= pagination.totalPages}
          onClick={() => onChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState({ items: [], pagination: null });
  const [payouts, setPayouts] = useState({ items: [], pagination: null });
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [payoutGateway, setPayoutGateway] = useState('');
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [detail, setDetail] = useState('');
  const [utrModal, setUtrModal] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const [withdrawalData, payoutData] = await Promise.all([
        fetchAdminWithdrawals({ page: withdrawalPage, limit: PAGE_SIZE, ...(withdrawalStatus && { status: withdrawalStatus }) }),
        fetchPayouts({ page: payoutPage, limit: PAGE_SIZE, ...(payoutStatus && { status: payoutStatus }), ...(payoutGateway && { gateway: payoutGateway }) }),
      ]);
      setWithdrawals(withdrawalData);
      setPayouts(payoutData);
    } catch (error) {
      showError(error.message || 'Unable to load financial operations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [withdrawalPage, payoutPage, withdrawalStatus, payoutStatus, payoutGateway]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openDialog = (type, item) => {
    setDetail('');
    setDialog({ type, item });
  };

  const openUtrModal = (item) => {
    setUtrNumber('');
    setUtrModal(item);
  };

  const submitUtrModal = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      showError('Please enter the Transaction ID / UTR Reference Number.');
      return;
    }

    try {
      // 1. Create Payout if not exists
      let payoutItem = payouts.items?.find((p) => String(p.withdraw_request_id) === String(utrModal.id));
      if (!payoutItem) {
        payoutItem = await createPayout({ withdrawRequestId: utrModal.id, gateway: 'BANK_TRANSFER' });
      }

      // 2. Mark as completed with UTR
      await updatePayout(payoutItem.id || payoutItem.data?.id, 'complete', { transactionReference: utrNumber.trim() });
      showSuccess(`Payout for ${utrModal.withdrawal_number} confirmed with UTR ${utrNumber.trim()}! ✅`);
      setUtrModal(null);
      load();
    } catch (err) {
      showError(err.message || 'Failed to submit UTR reference.');
    }
  };

  const approve = async (item) => {
    try {
      await approveWithdrawal(item.id);
      showSuccess('Withdrawal approved.');
      load();
    } catch (error) {
      showError(error.message || 'Approval failed.');
    }
  };

  const handlePayRazorpay = async (item) => {
    try {
      showSuccess('Initiating 1-Click Razorpay Payout...');
      const orderData = await createRazorpayPayoutOrder(item.id);

      const loadScript = () =>
        new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.crossOrigin = 'anonymous';
          script.integrity = 'sha384-PbJqxqn7GZcnYbsMDvfE6NSEuLqoC0pYWRxqFfeKFJ2LaeFJiJHCDXienGv6N9WA';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const loaded = await loadScript();
      if (!loaded) {
        showError('Razorpay SDK failed to load. Please check your network.');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Veggie Affiliate - Affiliate Payout',
        description: `Disbursal for Request #${item.withdrawal_number}`,
        order_id: orderData.orderId,
        prefill: {
          name: item.account_name || 'Affiliate Partner',
          email: item.user_email || '',
        },
        handler: async function (response) {
          await completeRazorpayPayout(item.id, response.razorpay_payment_id);
          showSuccess(`Payout ${item.withdrawal_number} completed successfully via Razorpay!`);
          load();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showError(err.message || 'Razorpay payout initiation failed.');
    }
  };

  const submitDialog = async (event) => {
    event.preventDefault();
    if (!detail.trim()) {
      showError('Please enter the required details.');
      return;
    }
    try {
      if (dialog.type === 'reject') await rejectWithdrawal(dialog.item.id, detail.trim());
      if (dialog.type === 'process') await updatePayout(dialog.item.id, 'process', { transactionReference: detail.trim() });
      if (dialog.type === 'complete') await updatePayout(dialog.item.id, 'complete', { transactionReference: detail.trim() });
      if (dialog.type === 'fail') await updatePayout(dialog.item.id, 'fail', { failureReason: detail.trim() });
      showSuccess(dialog.type === 'reject' ? 'Withdrawal rejected and balance released.' : `Payout ${dialog.type}d successfully.`);
      setDialog(null);
      load();
    } catch (error) {
      showError(error.message || 'Unable to update the financial record.');
    }
  };

  const dialogCopy =
    dialog?.type === 'reject'
      ? ['Reject withdrawal', 'Reason for rejection']
      : dialog?.type === 'fail'
      ? ['Fail payout', 'Failure reason']
      : dialog?.type === 'process'
      ? ['Process payout', 'Bank transaction reference']
      : ['Complete payout', 'Final transaction reference'];

  const handleExportWithdrawals = async () => {
    try {
      showSuccess('Downloading withdrawals CSV...');
      await exportWithdrawalsCsv();
    } catch (err) {
      showError('Failed to export withdrawals CSV.');
    }
  };

  const handleExportPayouts = async () => {
    try {
      showSuccess('Downloading payouts CSV...');
      await exportPayoutsCsv();
    } catch (err) {
      showError('Failed to export payouts CSV.');
    }
  };

  return (
    <div className="financial-admin-page p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-400" /> Withdrawal & Payout Management
          </h1>
          <p className="text-emerald-200/70 text-sm mt-1">
            Review requests, copy affiliate UPI IDs with 1-click, and confirm payouts via GPay/PhonePe UTR.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportWithdrawals}>
            📥 Export Withdrawals CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportPayouts}>
            📥 Export Payouts CSV
          </Button>
        </div>
      </div>

      <Card className="glass-card p-6 border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Withdrawal requests</h2>
            <p className="text-xs text-emerald-200/70">Approve requests, copy UPI handles, and enter UTR references.</p>
          </div>
          <Filter size={18} className="text-emerald-400" />
        </div>

        <div className="mb-4">
          <select
            value={withdrawalStatus}
            onChange={(e) => {
              setWithdrawalStatus(e.target.value);
              setWithdrawalPage(1);
            }}
            className="form-input bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2 px-3 rounded-xl"
          >
            {withdrawalStatuses.map((status) => (
              <option value={status} key={status || 'all'}>
                {status ? status.toUpperCase() : 'ALL STATUSES'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {withdrawals.items?.map((item) => {
            const upiTarget = item.upi_id || item.phone || '';
            return (
              <article
                key={item.id}
                className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 hover:border-emerald-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-white">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      #{item.withdrawal_number}
                    </span>
                    <Badge status={item.status}>{item.status}</Badge>
                  </div>

                  <p className="text-xs text-emerald-300 font-semibold">
                    Affiliate: {item.account_name || item.user_email || item.user_id} ({item.user_email})
                  </p>

                  {item.upi_id ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/30 p-2 rounded-xl border border-emerald-500/20 w-fit">
                      <span>📱 <strong>UPI ID:</strong> <code className="text-amber-300 font-bold">{item.upi_id}</code></span>
                      <button
                        onClick={() => copyToClipboard(item.upi_id, `upi-${item.id}`)}
                        className="p-1 hover:bg-emerald-500/20 rounded-md text-emerald-400 flex items-center gap-1 font-bold text-[11px]"
                        title="Copy UPI ID"
                      >
                        {copiedId === `upi-${item.id}` ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === `upi-${item.id}` ? 'Copied!' : 'Copy UPI'}
                      </button>
                    </div>
                  ) : item.account_number ? (
                    <div className="text-xs text-emerald-300/80 space-y-0.5 bg-emerald-900/20 p-2 rounded-xl border border-emerald-500/10">
                      <div>🏦 <strong>{item.bank_name || 'Bank Account'}</strong> · A/C: <code>{item.account_number}</code></div>
                      <div>IFSC: <code>{item.ifsc_code}</code> · Holder: <strong>{item.account_name}</strong></div>
                    </div>
                  ) : null}

                  <small className="text-[11px] text-emerald-300/60 block">
                    Requested: {formatDate(item.created_at)} {item.notes ? `· Note: ${item.notes}` : ''}
                  </small>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-emerald-500/20 pt-4 lg:pt-0">
                  {['pending', 'approved'].includes(item.status) && (
                    <>
                      <Button
                        onClick={() => openUtrModal(item)}
                        className="btn-primary text-xs py-2 px-3 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-bold flex items-center gap-1 shadow-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Mark Paid (GPay / PhonePe / UTR)
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePayRazorpay(item)}
                        className="text-xs"
                      >
                        💳 Razorpay
                      </Button>
                    </>
                  )}

                  {item.status === 'pending' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => approve(item)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => openDialog('reject', item)}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
          {!loading && withdrawals.items?.length === 0 && <p className="empty-state">No withdrawal requests match this filter.</p>}
        </div>
        <Paging pagination={withdrawals.pagination} onChange={setWithdrawalPage} />
      </Card>

      {/* UTR Confirmation Modal */}
      {utrModal && (
        <div className="financial-modal-backdrop" role="presentation">
          <form onSubmit={submitUtrModal} className="financial-modal glass-card p-6 rounded-2xl border border-emerald-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Confirm GPay / PhonePe Payout
              </h2>
              <button type="button" onClick={() => setUtrModal(null)} className="text-emerald-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-emerald-200/70">
              Enter the Transaction ID / UTR No. for <strong>{utrModal.withdrawal_number}</strong> (Amount: <strong>{formatCurrency(utrModal.amount)}</strong>).
            </p>

            <label className="block text-xs font-semibold text-emerald-300">
              Transaction ID / UTR Reference No. *
              <input
                type="text"
                autoFocus
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. UTR-660520178021 or 4029104810"
                className="form-input mt-1 w-full bg-emerald-950/80 border-emerald-500/40 text-white font-mono text-sm py-2.5 px-3 rounded-xl"
                required
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setUtrModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Confirm & Submit UTR
              </Button>
            </div>
          </form>
        </div>
      )}

      {dialog && (
        <div className="financial-modal-backdrop" role="presentation">
          <form
            className="financial-modal"
            onSubmit={submitDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="financial-dialog-title"
          >
            <button className="financial-modal-close" type="button" onClick={() => setDialog(null)} aria-label="Close">
              <X size={18} />
            </button>
            <h2 id="financial-dialog-title">{dialogCopy[0]}</h2>
            <p>
              {dialog.item.payout_number || dialog.item.withdrawal_number} · {formatCurrency(dialog.item.amount)}
            </p>
            <label>
              {dialogCopy[1]}
              <textarea autoFocus value={detail} onChange={(e) => setDetail(e.target.value)} maxLength="500" required />
            </label>
            <div className="financial-modal-actions">
              <Button type="button" variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" variant={dialog.type === 'reject' || dialog.type === 'fail' ? 'danger' : 'primary'}>
                Confirm
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
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

  const openDialog = (type, item) => {
    setDetail('');
    setDialog({ type, item });
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

  const create = async (item) => {
    try {
      await createPayout({ withdrawRequestId: item.id, gateway: 'BANK_TRANSFER' });
      showSuccess('Payout created.');
      load();
    } catch (error) {
      showError(error.message || 'Payout creation failed.');
    }
  };

  const approvePayoutRequest = async (item) => {
    try {
      await approvePayout(item.id);
      showSuccess('Payout approved. A different administrator can now process it.');
      load();
    } catch (error) {
      showError(error.message || 'Payout approval failed.');
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
    <div className="financial-admin-page">
      <div className="page-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Withdrawal & Payout Management</h1>
            <p>Review requests, auto-fetch bank details, and pay affiliates via 1-click Razorpay or Bank Transfer.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={handleExportWithdrawals}>
              📥 Export Withdrawals CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPayouts}>
              📥 Export Payouts CSV
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="financial-card-heading">
          <div>
            <h2>Withdrawal requests</h2>
            <p>Approve valid requests, auto-fetch affiliate bank details, or pay directly via Razorpay.</p>
          </div>
          <Filter size={18} />
        </div>

        <div className="financial-filters">
          <label>
            Status
            <select
              value={withdrawalStatus}
              onChange={(e) => {
                setWithdrawalStatus(e.target.value);
                setWithdrawalPage(1);
              }}
            >
              {withdrawalStatuses.map((status) => (
                <option value={status} key={status || 'all'}>
                  {status || 'All statuses'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-withdrawal-list">
          {withdrawals.items?.map((item) => (
            <article className="bank-account-item financial-record" key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <strong>
                  {formatCurrency(item.amount)} · {item.withdrawal_number}
                </strong>
                <p style={{ margin: '0.25rem 0', fontWeight: 600, color: 'var(--primary)' }}>
                  Affiliate: {item.user_email || item.user_id}
                </p>
                {item.account_number ? (
                  <div style={{ fontSize: '0.8125rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                    🏦 <strong>{item.bank_name || 'Bank Account'}</strong> · A/C: <code>{item.account_number}</code> · IFSC: <code>{item.ifsc_code}</code> · Holder: <strong>{item.account_name}</strong>
                  </div>
                ) : item.upi_id ? (
                  <div style={{ fontSize: '0.8125rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                    📱 <strong>UPI ID:</strong> <code>{item.upi_id}</code> · Name: <strong>{item.account_name}</strong>
                  </div>
                ) : null}
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Requested: {formatDate(item.created_at)} {item.notes ? `· Note: ${item.notes}` : ''}
                </small>
              </div>

              <div className="bank-account-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Badge status={item.status}>{item.status}</Badge>
                {['pending', 'approved'].includes(item.status) && (
                  <Button variant="primary" size="sm" onClick={() => handlePayRazorpay(item)}>
                    💳 Pay via Razorpay
                  </Button>
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
          ))}
          {!loading && withdrawals.items?.length === 0 && <p className="empty-state">No withdrawal requests match this filter.</p>}
        </div>
        <Paging pagination={withdrawals.pagination} onChange={setWithdrawalPage} />
      </Card>

      <Card>
        <div className="financial-card-heading">
          <div>
            <h2>Payouts</h2>
            <p>Record bank reference or verify Razorpay automated payouts.</p>
          </div>
          <Filter size={18} />
        </div>

        <div className="financial-filters">
          <label>
            Status
            <select
              value={payoutStatus}
              onChange={(e) => {
                setPayoutStatus(e.target.value);
                setPayoutPage(1);
              }}
            >
              {payoutStatuses.map((status) => (
                <option value={status} key={status || 'all'}>
                  {status || 'All statuses'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gateway
            <select
              value={payoutGateway}
              onChange={(e) => {
                setPayoutGateway(e.target.value);
                setPayoutPage(1);
              }}
            >
              <option value="">All gateways</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="MANUAL">Manual</option>
              <option value="RAZORPAY">Razorpay</option>
            </select>
          </label>
        </div>

        <div className="admin-withdrawal-list">
          {payouts.items?.map((item) => (
            <article className="bank-account-item financial-record" key={item.id}>
              <div>
                <strong>
                  {item.payout_number} · {formatCurrency(item.amount)}
                </strong>
                <p>
                  {item.gateway} · {item.transaction_reference || 'Reference not recorded'}
                </p>
                <small>Created {formatDate(item.created_at)}</small>
                <small>Approval: {item.approval_status || 'PENDING'}</small>
                {item.failure_reason && <small className="financial-error">Failure reason: {item.failure_reason}</small>}
              </div>
              <div className="bank-account-actions">
                <Badge status={item.status}>{item.status}</Badge>
                {item.status === 'PENDING' && item.approval_status !== 'APPROVED' && (
                  <Button onClick={() => approvePayoutRequest(item)}>Approve</Button>
                )}
                {item.status === 'PENDING' && item.approval_status === 'APPROVED' && (
                  <Button onClick={() => openDialog('process', item)}>Process</Button>
                )}
                {item.status === 'PROCESSING' && <Button onClick={() => openDialog('complete', item)}>Complete</Button>}
                {['PENDING', 'PROCESSING'].includes(item.status) && (
                  <Button variant="danger" onClick={() => openDialog('fail', item)}>
                    Fail
                  </Button>
                )}
              </div>
            </article>
          ))}
          {!loading && payouts.items?.length === 0 && <p className="empty-state">No payouts match this filter.</p>}
        </div>
        <Paging pagination={payouts.pagination} onChange={setPayoutPage} />
      </Card>

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

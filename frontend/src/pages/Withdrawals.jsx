import React, { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { fetchBankAccounts, fetchMyWithdrawals, createWithdrawal, cancelWithdrawal } from '../services/walletService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNotification } from '../hooks/useNotification';

export const Withdrawals = () => {
  const [accounts, setAccounts] = useState([]); const [items, setItems] = useState([]); const [amount, setAmount] = useState(''); const [bankAccountId, setBankAccountId] = useState(''); const { showSuccess, showError } = useNotification();
  const load = async () => { try { const [a, w] = await Promise.all([fetchBankAccounts(), fetchMyWithdrawals()]); setAccounts(a.filter((x) => x.verification_status === 'VERIFIED')); setItems(w.items || []); } catch (e) { showError(e.message || 'Unable to load withdrawals'); } };
  useEffect(() => { load(); }, []);
  const submit = async (e) => { e.preventDefault(); try { await createWithdrawal({ amount: Number(amount), bankAccountId }); setAmount(''); showSuccess('Withdrawal request submitted'); load(); } catch (err) { showError(err.message || 'Withdrawal request failed'); } };
  return <div><h1>Withdrawals</h1><Card><form onSubmit={submit}><input className="form-input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required /><select className="form-select" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} required><option value="">Select verified bank account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} · {a.account_number}</option>)}</select><Button type="submit">Request withdrawal</Button></form></Card><Card><h2>Request history</h2>{items.map((item) => <div key={item.id} className="flex justify-between" style={{ padding: '0.75rem 0' }}><span>{item.withdrawal_number} · {formatCurrency(item.amount)} · {item.status} · {formatDate(item.created_at)}</span>{item.status === 'pending' && <Button onClick={async () => { await cancelWithdrawal(item.id); load(); }}>Cancel</Button>}</div>)}</Card></div>;
};

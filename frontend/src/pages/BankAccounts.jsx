import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount } from '../services/walletService';
import { useNotification } from '../hooks/useNotification';

const emptyForm = { accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', upiId: '', accountType: 'SAVINGS' };

export const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotification();
  const load = async () => { try { setAccounts(await fetchBankAccounts()); } catch (error) { showError(error.message || 'Unable to load bank accounts'); } };
  useEffect(() => { load(); }, []);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await createBankAccount(form); setForm(emptyForm); showSuccess('Bank account added. It will be available after verification.'); load(); } catch (error) { showError(error.message || 'Unable to add bank account'); } finally { setSaving(false); } };
  const makeDefault = async (id) => { try { await setDefaultBankAccount(id); showSuccess('Default bank account updated'); load(); } catch (error) { showError(error.message || 'Unable to set default account'); } };
  const remove = async (id) => { if (!window.confirm('Delete this bank account?')) return; try { await deleteBankAccount(id); showSuccess('Bank account deleted'); load(); } catch (error) { showError(error.message || 'Unable to delete bank account'); } };
  return <div className="bank-accounts-page"><div className="page-heading"><h1>Bank Accounts</h1><p>Add a payout account. Only verified accounts can receive withdrawals.</p></div><div className="grid-2"><Card><h2>Add bank account</h2><form className="bank-account-form" onSubmit={submit}><input className="form-input" name="accountHolderName" placeholder="Account holder name" value={form.accountHolderName} onChange={change} required /><input className="form-input" name="bankName" placeholder="Bank name" value={form.bankName} onChange={change} required /><input className="form-input" name="accountNumber" inputMode="numeric" placeholder="Account number" value={form.accountNumber} onChange={change} required /><input className="form-input" name="ifscCode" placeholder="IFSC code" value={form.ifscCode} onChange={change} required /><input className="form-input" name="branchName" placeholder="Branch name (optional)" value={form.branchName} onChange={change} /><input className="form-input" name="upiId" placeholder="UPI ID (optional)" value={form.upiId} onChange={change} /><select className="form-select" name="accountType" value={form.accountType} onChange={change}><option value="SAVINGS">Savings account</option><option value="CURRENT">Current account</option></select><Button type="submit" loading={saving}>Add bank account</Button></form></Card><Card><h2>Your bank accounts</h2><div className="bank-account-list">{accounts.length === 0 && <p className="empty-state">No bank account added yet.</p>}{accounts.map((account) => <article className="bank-account-item" key={account.id}><div><strong>{account.bank_name}</strong><p>{account.account_holder_name} · {account.account_number}</p><small>{account.ifsc_code} · {account.account_type}</small></div><div className="bank-account-actions"><Badge status={account.verification_status}>{account.verification_status}</Badge>{account.is_default ? <span className="default-account">Default</span> : <Button onClick={() => makeDefault(account.id)}>Set default</Button>} {!account.is_default && <Button onClick={() => remove(account.id)}>Delete</Button>}</div></article>)}</div></Card></div></div>;
};

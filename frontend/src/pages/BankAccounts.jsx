import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount } from '../services/walletService';
import { useNotification } from '../hooks/useNotification';
import { Building2, UploadCloud, CheckCircle2, AlertCircle, Trash2, Star, FileText } from 'lucide-react';

const emptyForm = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
  accountType: 'SAVINGS',
  documentUrl: '',
};

export const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [docPreview, setDocPreview] = useState('');
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    try {
      setAccounts(await fetchBankAccounts());
    } catch (error) {
      showError(error.message || 'Unable to load bank accounts');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setDocPreview(base64Data);
      setForm((current) => ({ ...current, documentUrl: base64Data }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createBankAccount(form);
      setForm(emptyForm);
      setDocPreview('');
      showSuccess('Bank account & document submitted! Pending admin verification.');
      load();
    } catch (error) {
      showError(error.message || 'Unable to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id) => {
    try {
      await setDefaultBankAccount(id);
      showSuccess('Default bank account updated');
      load();
    } catch (error) {
      showError(error.message || 'Unable to set default account');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this bank account?')) return;
    try {
      await deleteBankAccount(id);
      showSuccess('Bank account deleted');
      load();
    } catch (error) {
      showError(error.message || 'Unable to delete bank account');
    }
  };

  return (
    <div className="bank-accounts-page">
      <div className="page-heading mb-6">
        <h1 className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-emerald-400" /> Payout Bank Accounts
        </h1>
        <p className="text-emerald-200/70">
          Upload your Bank Passbook or Cancelled Cheque for 100% free manual admin verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" /> Add Bank Account & Verification Doc
          </h2>
          <form className="bank-account-form space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Holder Name *</label>
              <input
                className="form-input w-full"
                name="accountHolderName"
                placeholder="Full name as printed in bank passbook"
                value={form.accountHolderName}
                onChange={change}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Bank Name *</label>
                <input
                  className="form-input w-full"
                  name="bankName"
                  placeholder="e.g. HDFC Bank, SBI"
                  value={form.bankName}
                  onChange={change}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Type *</label>
                <select className="form-select w-full" name="accountType" value={form.accountType} onChange={change}>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Number *</label>
                <input
                  className="form-input w-full"
                  name="accountNumber"
                  inputMode="numeric"
                  placeholder="9 to 18 digit account number"
                  value={form.accountNumber}
                  onChange={change}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">IFSC Code *</label>
                <input
                  className="form-input w-full uppercase"
                  name="ifscCode"
                  placeholder="e.g. HDFC0001234"
                  value={form.ifscCode}
                  onChange={change}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Branch Name (Optional)</label>
                <input
                  className="form-input w-full"
                  name="branchName"
                  placeholder="Branch location"
                  value={form.branchName}
                  onChange={change}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">UPI ID (Optional)</label>
                <input
                  className="form-input w-full"
                  name="upiId"
                  placeholder="e.g. name@upi"
                  value={form.upiId}
                  onChange={change}
                />
              </div>
            </div>

            {/* Document Upload Box */}
            <div className="border-2 border-dashed border-emerald-500/30 rounded-xl p-4 bg-emerald-950/40 text-center">
              <label className="block text-xs font-semibold text-emerald-300 mb-2 flex items-center justify-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-emerald-400" /> Upload Passbook Photo or Cancelled Cheque (JPG/PNG)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="passbook-upload"
              />
              <label
                htmlFor="passbook-upload"
                className="btn-secondary cursor-pointer inline-flex items-center gap-2 py-2 px-4 text-xs"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" /> Choose File
              </label>

              {docPreview && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <img src={docPreview} alt="Doc Preview" className="h-16 w-24 object-cover rounded border border-emerald-400/40" />
                  <span className="text-xs text-emerald-300 font-semibold">Ready for submission ✅</span>
                </div>
              )}
            </div>

            <Button type="submit" loading={saving} className="btn-primary w-full py-3">
              Submit Bank Details for Verification
            </Button>
          </form>
        </Card>

        <Card className="glass-card p-6 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Your Registered Bank Accounts</h2>
          <div className="bank-account-list space-y-4">
            {accounts.length === 0 && <p className="empty-state text-center text-emerald-200/50 py-8">No bank account added yet.</p>}
            {accounts.map((account) => (
              <article className="bank-account-item p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/30 flex justify-between items-center" key={account.id}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-white text-base">{account.bank_name}</strong>
                    <Badge status={account.verification_status}>{account.verification_status}</Badge>
                    {account.is_default && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-100">{account.account_holder_name} · {account.account_number}</p>
                  <small className="text-xs text-emerald-400 font-mono">{account.ifsc_code} · {account.account_type}</small>
                  {account.document_url && (
                    <div className="mt-2">
                      <a href={account.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 underline flex items-center gap-1">
                        <FileText className="w-3 h-3" /> View Submitted Passbook / Cheque
                      </a>
                    </div>
                  )}
                </div>
                <div className="bank-account-actions flex gap-2">
                  {!account.is_default && (
                    <Button onClick={() => makeDefault(account.id)} className="btn-secondary text-xs py-1 px-3">
                      Set Default
                    </Button>
                  )}
                  {!account.is_default && (
                    <Button onClick={() => remove(account.id)} className="btn-danger text-xs py-1 px-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

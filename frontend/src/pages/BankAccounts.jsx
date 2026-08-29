import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount } from '../services/walletService';
import { useNotification } from '../hooks/useNotification';
import { Building2, UploadCloud, CheckCircle2, AlertCircle, Trash2, Star, FileText, Smartphone, CreditCard } from 'lucide-react';

const emptyForm = {
  accountHolderName: '',
  upiId: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
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
      showError(error.message || 'Unable to load payout accounts');
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

    // Indian UPI ID or 10-Digit Mobile Validation
    if (form.upiId) {
      const upiClean = form.upiId.trim();
      const isUpiHandle = /^[\w.-]+@[\w.-]+$/i.test(upiClean);
      const isMobile = /^[6-9]\d{9}$/.test(upiClean);
      if (!isUpiHandle && !isMobile) {
        showError('Invalid UPI ID / Mobile Number. Enter name@ybl, name@paytm or 10-digit mobile number (e.g. 9876543210).');
        return;
      }
    } else if (!form.accountNumber || !form.ifscCode) {
      showError('Please enter either a UPI ID / PhonePe Number OR complete Bank Account details.');
      return;
    }

    setSaving(true);
    try {
      await createBankAccount(form);
      setForm(emptyForm);
      setDocPreview('');
      showSuccess('Payout Account added and Verified ✅ for instant withdrawals!');
      load();
    } catch (error) {
      showError(error.message || 'Unable to add payout account');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id) => {
    try {
      await setDefaultBankAccount(id);
      showSuccess('Default payout account updated');
      load();
    } catch (error) {
      showError(error.message || 'Unable to set default account');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this payout account?')) return;
    try {
      await deleteBankAccount(id);
      showSuccess('Payout account deleted');
      load();
    } catch (error) {
      showError(error.message || 'Unable to delete account');
    }
  };

  return (
    <div className="bank-accounts-page max-w-7xl mx-auto p-6 space-y-6">
      <div className="page-heading flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Smartphone className="w-8 h-8 text-emerald-400" /> UPI & Bank Payout Settings
          </h1>
          <p className="text-emerald-200/70 text-sm mt-1">
            Set up your primary UPI ID (PhonePe / GPay / Paytm) or Bank Account for instant 1-click payouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Form */}
        <Card className="glass-card p-6 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" /> Add Payout Account
          </h2>

          <form className="bank-account-form space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Holder Full Name *</label>
              <input
                className="form-input w-full bg-emerald-950/60 border-emerald-500/30 text-white text-sm py-2.5 px-3 rounded-xl"
                name="accountHolderName"
                placeholder="Full name as registered with UPI / Bank"
                value={form.accountHolderName}
                onChange={change}
                required
              />
            </div>

            {/* Primary Field: UPI ID / PhonePe / GPay Number */}
            <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/30 space-y-2">
              <label className="block text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" /> PRIMARY: UPI ID / PhonePe / GPay Mobile No.
              </label>
              <input
                className="form-input w-full bg-emerald-950/80 border-amber-500/40 text-amber-300 font-mono font-bold text-sm py-2.5 px-3 rounded-xl"
                name="upiId"
                placeholder="e.g. 9876543210@ybl, name@okaxis, 9876543210"
                value={form.upiId}
                onChange={change}
              />
              <p className="text-[11px] text-emerald-200/70">
                ⚡ Entering your UPI ID or 10-digit GPay/PhonePe number allows instant 1-click payouts without bank details!
              </p>
            </div>

            <div className="text-center text-xs text-emerald-400/60 font-semibold uppercase tracking-wider my-2">
              — OR Bank Details (Optional) —
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Bank Name (Optional)</label>
                <input
                  className="form-input w-full bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2 px-3 rounded-xl"
                  name="bankName"
                  placeholder="e.g. HDFC Bank, SBI"
                  value={form.bankName}
                  onChange={change}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Type</label>
                <select
                  className="form-select w-full bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2 px-3 rounded-xl"
                  name="accountType"
                  value={form.accountType}
                  onChange={change}
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Account Number (Optional)</label>
                <input
                  className="form-input w-full bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2 px-3 rounded-xl"
                  name="accountNumber"
                  inputMode="numeric"
                  placeholder="9 to 18 digit account number"
                  value={form.accountNumber}
                  onChange={change}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">IFSC Code (Optional)</label>
                <input
                  className="form-input w-full uppercase bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2 px-3 rounded-xl"
                  name="ifscCode"
                  placeholder="e.g. HDFC0001234"
                  value={form.ifscCode}
                  onChange={change}
                />
              </div>
            </div>

            {/* Document Upload Box */}
            <div className="border-2 border-dashed border-emerald-500/30 rounded-xl p-4 bg-emerald-950/40 text-center">
              <label className="block text-xs font-semibold text-emerald-300 mb-2 flex items-center justify-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-emerald-400" /> Optional Passbook Photo or Cancelled Cheque
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
                className="btn-secondary cursor-pointer inline-flex items-center gap-2 py-2 px-4 text-xs font-bold"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" /> Choose File
              </label>

              {docPreview && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <img src={docPreview} alt="Doc Preview" className="h-14 w-20 object-cover rounded border border-emerald-400/40" />
                  <span className="text-xs text-emerald-300 font-semibold">Document Attached ✅</span>
                </div>
              )}
            </div>

            <Button type="submit" loading={saving} className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Save & Auto-Verify Payout Account
            </Button>
          </form>
        </Card>

        {/* Registered Payout Accounts */}
        <Card className="glass-card p-6 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Your Registered Payout Accounts</h2>
          <div className="bank-account-list space-y-4">
            {accounts.length === 0 && (
              <p className="empty-state text-center text-emerald-200/50 py-12">No payout account registered yet.</p>
            )}
            {accounts.map((account) => (
              <article
                className="bank-account-item p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/40 flex justify-between items-center gap-4"
                key={account.id}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">{account.account_holder_name}</strong>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified ✅
                    </span>
                    {account.is_default && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>

                  {account.upi_id && (
                    <p className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" /> UPI ID: {account.upi_id}
                    </p>
                  )}

                  {account.account_number && account.account_number !== 'UPI_PAYOUT' && (
                    <p className="text-xs text-emerald-100">
                      🏦 {account.bank_name} · A/C: {account.account_number} (IFSC: {account.ifsc_code})
                    </p>
                  )}

                  {account.document_url && (
                    <div className="pt-1">
                      <a
                        href={account.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> View Submitted Passbook / Cheque
                      </a>
                    </div>
                  )}
                </div>

                <div className="bank-account-actions flex gap-2">
                  {!account.is_default && (
                    <Button onClick={() => makeDefault(account.id)} className="btn-secondary text-xs py-1 px-2.5">
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

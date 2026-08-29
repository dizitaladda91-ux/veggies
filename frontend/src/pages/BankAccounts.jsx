import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount } from '../services/walletService';
import { useNotification } from '../hooks/useNotification';
import { Building2, UploadCloud, CheckCircle2, Trash2, Star, FileText, Smartphone } from 'lucide-react';

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
    <div className="bank-accounts-page max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header Banner */}
      <div className="page-heading flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/50 p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-emerald-400" /> UPI & Bank Payout Settings
          </h1>
          <p className="text-emerald-200/80 text-sm mt-1">
            Set up your primary UPI ID (PhonePe / GPay / Paytm) or Bank Account for instant 1-click payouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Structured Account Form */}
        <Card className="glass-card p-6 border-emerald-500/20 bg-emerald-950/40 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Add Payout Account</h2>
          </div>

          <form className="bank-account-form space-y-5" onSubmit={submit}>
            {/* Account Holder Name */}
            <div className="payout-form-group">
              <label htmlFor="accountHolderName">Account Holder Full Name *</label>
              <input
                id="accountHolderName"
                className="form-input w-full bg-emerald-950/80 border-emerald-500/40 text-white font-medium text-sm py-2.5 px-3.5 rounded-xl outline-none focus:border-emerald-400"
                name="accountHolderName"
                placeholder="Full name as registered with UPI / Bank"
                value={form.accountHolderName}
                onChange={change}
                required
              />
            </div>

            {/* Primary Highlighted UPI ID Box */}
            <div className="payout-upi-card">
              <label htmlFor="upiId" className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Smartphone className="w-4 h-4 text-amber-400" /> PRIMARY: UPI ID / PhonePe / GPay Mobile No.
              </label>
              <input
                id="upiId"
                className="payout-upi-input"
                name="upiId"
                placeholder="e.g. 9876543210@ybl, name@okaxis, 9876543210"
                value={form.upiId}
                onChange={change}
              />
              <p className="text-[11px] text-emerald-200/80 leading-relaxed pt-1">
                ⚡ Entering your UPI ID or 10-digit GPay/PhonePe number allows instant 1-click payouts without bank details!
              </p>
            </div>

            {/* OR Divider */}
            <div className="payout-divider">
              <span>— OR Bank Details (Optional) —</span>
            </div>

            {/* Bank Details Grid Row 1 */}
            <div className="payout-field-row">
              <div className="payout-form-group">
                <label htmlFor="bankName">Bank Name (Optional)</label>
                <input
                  id="bankName"
                  className="form-input w-full bg-emerald-950/70 border-emerald-500/30 text-white text-xs py-2.5 px-3 rounded-xl"
                  name="bankName"
                  placeholder="e.g. HDFC Bank, SBI"
                  value={form.bankName}
                  onChange={change}
                />
              </div>

              <div className="payout-form-group">
                <label htmlFor="accountType">Account Type</label>
                <select
                  id="accountType"
                  className="form-select w-full bg-emerald-950/70 border-emerald-500/30 text-white text-xs py-2.5 px-3 rounded-xl"
                  name="accountType"
                  value={form.accountType}
                  onChange={change}
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>
            </div>

            {/* Bank Details Grid Row 2 */}
            <div className="payout-field-row">
              <div className="payout-form-group">
                <label htmlFor="accountNumber">Account Number (Optional)</label>
                <input
                  id="accountNumber"
                  className="form-input w-full bg-emerald-950/70 border-emerald-500/30 text-white text-xs py-2.5 px-3 rounded-xl"
                  name="accountNumber"
                  inputMode="numeric"
                  placeholder="9 to 18 digit account number"
                  value={form.accountNumber}
                  onChange={change}
                />
              </div>

              <div className="payout-form-group">
                <label htmlFor="ifscCode">IFSC Code (Optional)</label>
                <input
                  id="ifscCode"
                  className="form-input w-full uppercase bg-emerald-950/70 border-emerald-500/30 text-white text-xs py-2.5 px-3 rounded-xl"
                  name="ifscCode"
                  placeholder="e.g. HDFC0001234"
                  value={form.ifscCode}
                  onChange={change}
                />
              </div>
            </div>

            {/* Structured Document Upload Box */}
            <div className="payout-upload-box">
              <label className="text-xs font-bold text-emerald-200 flex items-center justify-center gap-2 cursor-pointer m-0">
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
                className="btn-secondary cursor-pointer inline-flex items-center gap-2 py-2 px-4 text-xs font-bold bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 rounded-xl"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" /> Choose File
              </label>

              {docPreview ? (
                <div className="flex items-center gap-3 pt-1">
                  <img src={docPreview} alt="Doc Preview" className="h-12 w-16 object-cover rounded-lg border border-emerald-400/50 shadow" />
                  <span className="text-xs text-emerald-300 font-semibold">Document Attached ✅</span>
                </div>
              ) : (
                <span className="text-[11px] text-emerald-300/60">Upload photo for manual bank verification (Optional)</span>
              )}
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              loading={saving}
              className="btn-primary w-full py-3 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-extrabold rounded-xl shadow-lg"
            >
              Save & Auto-Verify Payout Account
            </Button>
          </form>
        </Card>

        {/* Right Column: Registered Accounts List */}
        <Card className="glass-card p-6 border-emerald-500/20 bg-emerald-950/40 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Your Registered Payout Accounts</h2>
          </div>

          <div className="bank-account-list space-y-4">
            {accounts.length === 0 && (
              <div className="text-center text-emerald-200/50 py-16 space-y-2">
                <Smartphone className="w-10 h-10 text-emerald-500/30 mx-auto" />
                <p className="text-sm">No payout account registered yet.</p>
                <p className="text-xs text-emerald-300/40">Add your UPI ID or Bank details to start receiving withdrawals.</p>
              </div>
            )}

            {accounts.map((account) => (
              <article
                className="bank-account-item p-4 rounded-xl border border-emerald-500/30 bg-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                key={account.id}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white text-sm font-bold">{account.account_holder_name}</strong>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified ✅
                    </span>
                    {account.is_default && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400" /> Default
                      </span>
                    )}
                  </div>

                  {account.upi_id && (
                    <p className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" /> UPI ID: {account.upi_id}
                    </p>
                  )}

                  {account.account_number && account.account_number !== 'UPI_PAYOUT' && (
                    <p className="text-xs text-emerald-100/90 font-medium">
                      🏦 {account.bank_name} · A/C: {account.account_number} (IFSC: {account.ifsc_code})
                    </p>
                  )}

                  {account.document_url && (
                    <div className="pt-1">
                      <a
                        href={account.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Submitted Passbook / Cheque
                      </a>
                    </div>
                  )}
                </div>

                <div className="bank-account-actions flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/20">
                  {!account.is_default && (
                    <Button onClick={() => makeDefault(account.id)} className="btn-secondary text-xs py-1.5 px-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/30">
                      Set Default
                    </Button>
                  )}
                  {!account.is_default && (
                    <Button onClick={() => remove(account.id)} className="btn-danger text-xs p-2 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 rounded-lg">
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

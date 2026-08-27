import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useNotification } from '../hooks/useNotification';
import { Building2, FileText, CheckCircle2, XCircle, Search, Eye, Filter, ShieldCheck, UserCheck } from 'lucide-react';

export const AdminBankAccounts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null); // Lightbox modal document
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bank-accounts/admin/all');
      setItems(res.data.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id, actionName) => {
    try {
      await api.patch(`/bank-accounts/${id}/${actionName}`);
      showSuccess(`Bank account ${actionName === 'verify' ? 'VERIFIED ✅' : 'REJECTED ❌'} successfully`);
      load();
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${actionName} bank account`);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === 'ALL' || item.verification_status === activeTab;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (item.account_holder_name && item.account_holder_name.toLowerCase().includes(query)) ||
      (item.bank_name && item.bank_name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.account_number && item.account_number.toLowerCase().includes(query)) ||
      (item.ifsc_code && item.ifsc_code.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const counts = {
    ALL: items.length,
    PENDING: items.filter((i) => i.verification_status === 'PENDING').length,
    VERIFIED: items.filter((i) => i.verification_status === 'VERIFIED').length,
    REJECTED: items.filter((i) => i.verification_status === 'REJECTED').length,
  };

  return (
    <div className="admin-bank-verification-page p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" /> Manual Bank Document Verification
          </h1>
          <p className="text-emerald-200/70 text-sm mt-1">
            Review uploaded Bank Passbooks or Cancelled Cheques and verify affiliate payout accounts with 0 API charges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status="PENDING" className="text-sm px-4 py-2">
            {counts.PENDING} Pending Verifications
          </Badge>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-emerald-950/50 p-1.5 rounded-xl border border-emerald-500/20">
          {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
          <input
            type="text"
            placeholder="Search affiliate, bank, IFSC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 w-full bg-emerald-950/60 border-emerald-500/30 text-white text-xs py-2.5 rounded-xl"
          />
        </div>
      </div>

      {/* Accounts List Grid */}
      <Card className="glass-card p-6 border-emerald-500/20">
        {loading ? (
          <div className="text-center py-12 text-emerald-300 animate-pulse">Loading bank verification requests...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-emerald-200/50">
            No bank accounts found for filter "{activeTab}".
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((account) => (
              <article
                key={account.id}
                className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 hover:border-emerald-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Account Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <strong className="text-lg text-white font-bold">{account.bank_name}</strong>
                    <Badge status={account.verification_status}>{account.verification_status}</Badge>
                    {account.is_default && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                        Default Payout Account
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-emerald-400 font-semibold block">Affiliate User</span>
                      <span className="text-white font-medium">{account.first_name || 'Affiliate'} ({account.email})</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold block">Account Holder Name</span>
                      <span className="text-white font-medium">{account.account_holder_name}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold block">Account Number</span>
                      <span className="text-white font-mono">{account.account_number}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold block">IFSC Code & Type</span>
                      <span className="text-white font-mono">{account.ifsc_code} ({account.account_type})</span>
                    </div>
                  </div>
                </div>

                {/* Document & Actions */}
                <div className="flex items-center gap-4 border-t lg:border-t-0 border-emerald-500/20 pt-4 lg:pt-0">
                  {account.document_url ? (
                    <button
                      onClick={() => setSelectedDoc(account)}
                      className="btn-secondary text-xs flex items-center gap-2 py-2 px-3 border border-emerald-400/30 hover:bg-emerald-900/40 text-emerald-200"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" /> Inspect Passbook / Cheque
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400/70 italic">No document attached</span>
                  )}

                  {account.verification_status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAction(account.id, 'verify')}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                      </Button>
                      <Button
                        onClick={() => handleAction(account.id, 'reject')}
                        className="btn-danger text-xs py-2 px-3 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-emerald-950 border border-emerald-500/30 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 text-emerald-300 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Submitted Document Verification
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/20">
              <div>
                <span className="text-emerald-400">Account Holder:</span> <strong className="text-white">{selectedDoc.account_holder_name}</strong>
              </div>
              <div>
                <span className="text-emerald-400">Bank Name:</span> <strong className="text-white">{selectedDoc.bank_name}</strong>
              </div>
              <div>
                <span className="text-emerald-400">Account Number:</span> <strong className="text-white">{selectedDoc.account_number}</strong>
              </div>
              <div>
                <span className="text-emerald-400">IFSC Code:</span> <strong className="text-white">{selectedDoc.ifsc_code}</strong>
              </div>
            </div>

            <div className="border border-emerald-500/20 rounded-xl overflow-hidden max-h-96 flex items-center justify-center bg-black">
              <img
                src={selectedDoc.document_url}
                alt="Passbook / Cheque Document"
                className="max-h-96 w-auto object-contain"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedDoc.verification_status === 'PENDING' && (
                <>
                  <Button
                    onClick={() => {
                      handleAction(selectedDoc.id, 'reject');
                      setSelectedDoc(null);
                    }}
                    className="btn-danger text-xs py-2 px-4"
                  >
                    Reject Account
                  </Button>
                  <Button
                    onClick={() => {
                      handleAction(selectedDoc.id, 'verify');
                      setSelectedDoc(null);
                    }}
                    className="btn-primary text-xs py-2 px-6"
                  >
                    Confirm & Approve Account
                  </Button>
                </>
              )}
              <Button onClick={() => setSelectedDoc(null)} className="btn-secondary text-xs py-2 px-4">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

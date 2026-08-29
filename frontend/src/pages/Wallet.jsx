import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Wallet as WalletIcon, Clock, CheckCircle2, ArrowUpRight, History } from 'lucide-react';
import { fetchWalletSummary, fetchWalletTransactions } from '../services/walletService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const Wallet = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        fetchWalletSummary(),
        fetchWalletTransactions({ page: 1, limit: 10 }),
      ]);
      setSummary(sumRes);
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const available = parseFloat(summary?.available_balance || 0);
  const pending = parseFloat(summary?.pending_balance || 0);
  const totalPaid = parseFloat(summary?.total_withdrawn || 0);

  return (
    <div className="wallet-page max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <WalletIcon className="w-8 h-8 text-emerald-400" /> My Wallet & Financial Overview
          </h1>
          <p className="text-emerald-200/70 text-sm mt-1">
            Real-time balance tracking, pending disbursals, and confirmed payout history.
          </p>
        </div>

        <Button
          onClick={() => navigate(ROUTES.WITHDRAWALS)}
          className="btn-primary py-3 px-6 rounded-xl text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white shadow-lg"
        >
          <ArrowUpRight className="w-4 h-4" /> Request Payout
        </Button>
      </div>

      {/* 3-Card Financial Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Available Balance */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-emerald-950/90 relative overflow-hidden group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">💜 AVAILABLE BALANCE</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(available)}</span>
            <p className="text-xs text-purple-200/70 mt-1">Ready for instant bank/UPI withdrawal</p>
          </div>
        </div>

        {/* Card 2: Pending Withdrawal */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-amber-950/20 to-emerald-950/90 relative overflow-hidden group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">⌛ PENDING WITHDRAWAL</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{formatCurrency(pending)}</span>
            <p className="text-xs text-amber-200/70 mt-1">Awaiting admin UTR disbursal</p>
          </div>
        </div>

        {/* Card 3: Confirmed Received / Paid */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-emerald-950/90 relative overflow-hidden group shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">✅ CONFIRMED RECEIVED / PAID</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{formatCurrency(totalPaid)}</span>
            <p className="text-xs text-emerald-200/70 mt-1">Total payouts confirmed in bank/UPI</p>
          </div>
        </div>
      </div>

      {/* Ledger Transactions */}
      <Card className="glass-card p-6 border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> Wallet Ledger & Activity
          </h2>
          <span className="text-xs text-emerald-300/70">Showing latest transactions</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-emerald-300 animate-pulse">Loading wallet transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-emerald-200/50">No transactions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isCredit = ['COMMISSION_SETTLEMENT', 'CREDIT', 'WITHDRAWAL_RELEASE'].includes(tx.type);
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/40 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{tx.description || tx.type}</span>
                    <span className="text-emerald-300/70">{formatDate(tx.created_at)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className="block text-[10px] text-emerald-200/50">Bal: {formatCurrency(tx.closing_balance)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

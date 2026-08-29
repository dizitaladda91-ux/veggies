import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
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
    <div className="wallet-page-container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/50 p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-emerald-400" /> My Wallet & Financial Overview
          </h1>
          <p className="text-emerald-200/80 text-sm mt-1">
            Real-time balance tracking, pending disbursals, and confirmed payout history.
          </p>
        </div>

        <Button
          onClick={() => navigate(ROUTES.WITHDRAWALS)}
          className="btn-primary py-3 px-6 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white shadow-lg transition-transform active:scale-95"
        >
          <ArrowUpRight className="w-4 h-4" /> Request Payout
        </Button>
      </div>

      {/* 3-Card Financial Stat Grid */}
      <div className="wallet-cards-grid grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Available Balance */}
        <div className="wallet-stat-card card-purple p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-emerald-950/90 via-purple-950/20 to-emerald-950/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">AVAILABLE BALANCE</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl md:text-4xl font-black text-white tracking-tight">{formatCurrency(available)}</div>
            <p className="text-xs text-purple-200/70 font-medium mt-1">Ready for instant bank/UPI withdrawal</p>
          </div>
        </div>

        {/* Card 2: Pending Withdrawal */}
        <div className="wallet-stat-card card-amber p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-emerald-950/90 via-amber-950/20 to-emerald-950/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">PENDING WITHDRAWAL</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl md:text-4xl font-black text-amber-400 tracking-tight">{formatCurrency(pending)}</div>
            <p className="text-xs text-amber-200/70 font-medium mt-1">Awaiting admin UTR disbursal</p>
          </div>
        </div>

        {/* Card 3: Confirmed Received / Paid */}
        <div className="wallet-stat-card card-emerald p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 via-emerald-900/30 to-emerald-950/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">CONFIRMED RECEIVED / PAID</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl md:text-4xl font-black text-emerald-400 tracking-tight">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-emerald-200/70 font-medium mt-1">Total payouts confirmed in bank/UPI</p>
          </div>
        </div>
      </div>

      {/* Ledger Transactions */}
      <Card className="glass-card p-6 border-emerald-500/20 bg-emerald-950/40 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> Wallet Ledger & Activity
          </h2>
          <span className="text-xs font-medium text-emerald-300/70 bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/20">
            Showing latest transactions
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-emerald-300 font-semibold animate-pulse">Loading wallet transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-emerald-200/50 space-y-2">
            <History className="w-10 h-10 text-emerald-500/30 mx-auto" />
            <p className="text-sm font-medium">No transactions recorded yet.</p>
            <p className="text-xs text-emerald-300/40">Your commission payouts and withdrawals will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isCredit = ['COMMISSION_SETTLEMENT', 'CREDIT', 'WITHDRAWAL_RELEASE'].includes(tx.type);
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-900/20 hover:bg-emerald-900/30 transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">{tx.description || tx.type}</span>
                    <span className="text-emerald-300/70 text-[11px] block">{formatDate(tx.created_at)}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`font-mono font-black text-base block ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className="block text-[11px] text-emerald-200/60 font-medium">Closing Bal: {formatCurrency(tx.closing_balance)}</span>
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

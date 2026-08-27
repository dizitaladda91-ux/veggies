import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { DollarSign, Clock } from 'lucide-react';
import { fetchWalletSummary } from '../services/walletService';
import { formatCurrency } from '../utils/formatters';

export const Wallet = () => {
  const [summary, setSummary] = useState(null);
  useEffect(() => { fetchWalletSummary().then(setSummary).catch(console.error); }, []);
  return <div><h1>My Wallet</h1><div className="grid-4"><StatCard title="Available balance" value={formatCurrency(summary?.available_balance || 0)} icon={DollarSign} /><StatCard title="Pending withdrawal" value={formatCurrency(summary?.pending_balance || 0)} icon={Clock} /></div><Card><p>Your available balance can be requested as a bank-transfer withdrawal.</p></Card></div>;
};

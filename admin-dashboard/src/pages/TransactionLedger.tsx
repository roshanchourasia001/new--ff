import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Search, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  Filter, 
  Copy, 
  Check, 
  Download, 
  TrendingUp, 
  Wallet, 
  Sparkles,
  ShieldCheck,
  ReceiptText
} from 'lucide-react';
import { fetchTransactions, massBonusCredit } from '../api';

export const TransactionLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mass Bonus Modal State
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('20');
  const [bonusReason, setBonusReason] = useState('Season Kickoff Community Reward');
  const [submittingBonus, setSubmittingBonus] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetchTransactions();
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMassBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(bonusAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid bonus amount');
      return;
    }

    if (!confirm(`Are you sure you want to credit ₹${amt} to ALL active players?`)) return;

    setSubmittingBonus(true);
    try {
      const res = await massBonusCredit(amt, bonusReason);
      if (res.success) {
        alert(res.message);
        setShowBonusModal(false);
        loadTransactions();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingBonus(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Tx ID', 'User ID', 'Player Name', 'IGN', 'Type', 'Amount (₹)', 'Tx Hash', 'Date', 'Description'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.userId,
      `"${t.userName || ''}"`,
      `"${t.userIgn || ''}"`,
      t.type,
      t.amount,
      t.txHash,
      t.createdAt,
      `"${t.description || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ffesports_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.txHash && t.txHash.toLowerCase().includes(q)) ||
      (t.userId && t.userId.toLowerCase().includes(q)) ||
      (t.userName && t.userName.toLowerCase().includes(q)) ||
      (t.userIgn && t.userIgn.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const totalDeposits = transactions.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + (t.amount || 0), 0);
  const totalPrizes = transactions.filter(t => t.type === 'MATCH_WINNING' || t.type === 'KILL_REWARD').reduce((s, t) => s + (t.amount || 0), 0);
  const totalCashouts = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + (t.amount || 0), 0);
  const totalEntryFees = transactions.filter(t => t.type === 'ENTRY_FEE').reduce((s, t) => s + (t.amount || 0), 0);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'MATCH_WINNING':
      case 'KILL_REWARD':
      case 'BONUS': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'WITHDRAWAL': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ENTRY_FEE': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'REFUND': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PENALTY': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isCredit = (type: string) => {
    return ['DEPOSIT', 'MATCH_WINNING', 'KILL_REWARD', 'BONUS', 'REFUND'].includes(type);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <ReceiptText className="w-5 h-5 text-teal-600" />
            </span>
            Platform Financial & Wallet Ledger
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time auditable ledger of all player wallet deposits, tournament payouts, entry fees, and UPI cashouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBonusModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs transition"
          >
            <Gift className="w-4 h-4" />
            <span>Mass Bonus Credit</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics in Light Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Deposits</span>
          <p className="text-2xl font-black text-teal-600 mt-1">₹{totalDeposits.toLocaleString()}</p>
          <span className="text-[11px] font-medium text-slate-400">Inward UPI Player Deposits</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Entry Fees Inflow</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">₹{totalEntryFees.toLocaleString()}</p>
          <span className="text-[11px] font-medium text-slate-400">Paid Match Slot Registrations</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prizes Awarded</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalPrizes.toLocaleString()}</p>
          <span className="text-[11px] font-medium text-slate-400">Booyah & Kill Payouts</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cashouts Settled</span>
          <p className="text-2xl font-black text-amber-600 mt-1">₹{totalCashouts.toLocaleString()}</p>
          <span className="text-[11px] font-medium text-slate-400">Disbursed via Bank / UPI</span>
        </div>
      </div>

      {/* Filters & Search in Light Theme */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Tx ID, Hash, User, or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-blue-600"
          >
            <option value="ALL">All Types ({transactions.length})</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="ENTRY_FEE">ENTRY_FEE</option>
            <option value="MATCH_WINNING">MATCH_WINNING</option>
            <option value="KILL_REWARD">KILL_REWARD</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="BONUS">BONUS</option>
            <option value="REFUND">REFUND</option>
            <option value="PENALTY">PENALTY</option>
          </select>
          <span className="text-xs text-slate-400 font-medium ml-2">
            Showing <strong className="text-slate-800">{filteredTransactions.length}</strong> items
          </span>
        </div>
      </div>

      {/* Ledger Table in Light Theme */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Description / Match</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 100).map(t => {
                  const credit = isCredit(t.type);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{t.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.userIgn} • {t.userId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getTypeStyle(t.type)}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-black text-sm ${credit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {credit ? '+' : '-'}₹{t.amount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                        {t.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => copyToClipboard(t.txHash, t.id)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200"
                        >
                          {copiedKey === t.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>{t.txHash}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mass Bonus Modal in Light Theme */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                Community Mass Bonus Voucher
              </h4>
              <button 
                onClick={() => setShowBonusModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Credit promotional balance instantly to all registered player accounts. Each player receives an in-app congratulations notification.
            </p>

            <form onSubmit={handleMassBonusSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Amount Per Player (₹)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['10', '20', '50', '100'].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setBonusAmount(val)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                        bonusAmount === val ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title / Audit Note</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:border-amber-500 outline-none"
                  placeholder="e.g. Diwali Flash Giveaway"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBonus}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{submittingBonus ? 'Crediting...' : 'Execute Mass Bonus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

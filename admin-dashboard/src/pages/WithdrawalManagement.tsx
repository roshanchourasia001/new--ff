import React, { useEffect, useState } from 'react';
import { Check, X, Shield, Clock, AlertTriangle, ExternalLink, Copy, CheckCheck, RefreshCw, Search, DollarSign, Wallet } from 'lucide-react';
import { fetchWithdrawals, handleWithdrawal } from '../api';

export const WithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUCCESSFUL' | 'REJECTED'>('ALL');
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  // Approval modal state
  const [approvingItem, setApprovingItem] = useState<any | null>(null);
  const [payoutRef, setPayoutRef] = useState('');

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid UPI ID or account mismatch');

  const loadData = () => {
    setLoading(true);
    fetchWithdrawals().then(res => {
      if (res.success) setWithdrawals(res.withdrawals || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(upiId);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  const openApproveModal = (w: any) => {
    setApprovingItem(w);
    setPayoutRef(`UPI_${Date.now()}`);
  };

  const submitApprove = async () => {
    if (!approvingItem) return;
    const res = await handleWithdrawal(approvingItem.id, true, payoutRef);
    if (res.success) {
      setApprovingItem(null);
      loadData();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const openRejectModal = (w: any) => {
    setRejectingItem(w);
    setRejectReason('Invalid UPI ID or account mismatch');
  };

  const submitReject = async () => {
    if (!rejectingItem) return;
    const res = await handleWithdrawal(rejectingItem.id, false, undefined, rejectReason);
    if (res.success) {
      setRejectingItem(null);
      loadData();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const successfulCount = withdrawals.filter(w => w.status === 'SUCCESSFUL').length;
  const totalDisbursed = withdrawals
    .filter(w => w.status === 'SUCCESSFUL')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const filtered = withdrawals.filter(w => {
    if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.userName && w.userName.toLowerCase().includes(q)) ||
      (w.userId && w.userId.toLowerCase().includes(q)) ||
      (w.upiId && w.upiId.toLowerCase().includes(q)) ||
      (w.id && w.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </span>
            UPI Cashout Settlement Desk
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit player cashout requests, copy verified UPI VPA IDs, and execute bank settlement transactions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Cashouts</span>
        </button>
      </div>

      {/* KPI Cards in Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending Queue</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{pendingCount} Requests</p>
          <span className="text-[11px] font-medium text-slate-400">Needs UTR & Approval</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalDisbursed.toLocaleString()}</p>
          <span className="text-[11px] font-medium text-slate-400">Paid out via UPI</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Settled Requests</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{successfulCount} Successful</p>
          <span className="text-[11px] font-medium text-slate-400">Bank UTR verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search User ID, Name, UPI ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PENDING', 'SUCCESSFUL', 'REJECTED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table in Light Theme */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Player Details</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Recipient UPI VPA</th>
                <th className="py-3.5 px-4">Requested At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Settlement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    Loading cashout records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No cashout requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      {w.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{w.userName || w.userId}</div>
                      <div className="text-[11px] font-mono text-slate-400">{w.userId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-base text-rose-600">₹{w.amount}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 w-fit">
                        <span>{w.upiId}</span>
                        <button
                          onClick={() => handleCopyUpi(w.upiId)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copy UPI ID"
                        >
                          {copiedUpi === w.upiId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(w.requestedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        w.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : w.status === 'SUCCESSFUL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {w.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => openApproveModal(w)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(w)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {w.payoutTxnId || w.failureReason || 'Settled'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <h4 className="text-lg font-black text-slate-900">Confirm UPI Cashout Approval</h4>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
              <div>Amount to Transfer: <strong className="text-emerald-700 text-base">₹{approvingItem.amount}</strong></div>
              <div>Recipient UPI VPA: <strong className="font-mono text-slate-900">{approvingItem.upiId}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank UTR / Reference Transaction ID</label>
              <input
                type="text"
                required
                value={payoutRef}
                onChange={e => setPayoutRef(e.target.value)}
                placeholder="e.g. 402910382910"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApprove}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition"
              >
                Approve & Mark Transferred
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <h4 className="text-lg font-black text-slate-900">Reject Cashout Request</h4>
            <p className="text-xs text-slate-500">
              The requested amount (₹{rejectingItem.amount}) will be automatically refunded to the player's wallet balance.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:border-rose-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition"
              >
                Reject & Refund Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

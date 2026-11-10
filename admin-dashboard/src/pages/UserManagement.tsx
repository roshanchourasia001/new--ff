import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Ban, 
  CheckCircle, 
  ShieldAlert, 
  Wallet, 
  Edit3, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Sparkles,
  Eye,
  X,
  Trophy,
  History,
  Phone,
  Mail,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { fetchUsers, toggleUserBan, updateUser, adjustUserWallet, fetchUserDetails } from '../api';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit User State
  const [editUserModal, setEditUserModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', ign: '', ffUid: '', phone: '', state: '', country: 'India' });

  // Wallet Adjustment State
  const [walletModalUser, setWalletModalUser] = useState<any>(null);
  const [walletForm, setWalletForm] = useState({ amount: '', type: 'CREDIT', reason: '' });

  // Inspect Player Details State
  const [inspectUserModal, setInspectUserModal] = useState<any | null>(null);
  const [inspectDetails, setInspectDetails] = useState<any | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    fetchUsers().then(res => {
      if (res.success) setUsers(res.users);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBanToggle = async (userId: string) => {
    const res = await toggleUserBan(userId);
    if (res.success) {
      loadUsers();
    }
  };

  const handleEditOpen = (user: any) => {
    setEditUserModal(user);
    setEditForm({
      name: user.name || '',
      ign: user.ign || '',
      ffUid: user.ffUid || '',
      phone: user.phone || '',
      state: user.state || '',
      country: user.country || 'India'
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    const res = await updateUser(editUserModal.id, editForm);
    if (res.success) {
      alert('User profile updated successfully!');
      setEditUserModal(null);
      loadUsers();
    } else {
      alert('Error updating user: ' + res.message);
    }
  };

  const handleWalletOpen = (user: any) => {
    setWalletModalUser(user);
    setWalletForm({ amount: '100', type: 'CREDIT', reason: 'Tournament prize bonus credit' });
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser) return;
    const amt = Number(walletForm.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    const res = await adjustUserWallet(walletModalUser.id, amt, walletForm.type as any, walletForm.reason);
    if (res.success) {
      alert(`Wallet ${walletForm.type === 'CREDIT' ? 'credited' : 'debited'} ₹${amt} successfully!`);
      setWalletModalUser(null);
      loadUsers();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleInspectOpen = async (user: any) => {
    setInspectUserModal(user);
    setLoadingInspect(true);
    try {
      const res = await fetchUserDetails(user.id);
      if (res.success) {
        setInspectDetails(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInspect(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const pid = u.profileId || (u.id ? `PID-${u.id.replace(/\D/g, '') || '1001'}` : '');
    const matchesSearch = 
      pid.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.ign?.toLowerCase().includes(search.toLowerCase()) ||
      u.ffUid?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'BANNED') return u.isBanned;
    if (statusFilter === 'ACTIVE') return !u.isBanned && u.isProfileComplete;
    if (statusFilter === 'INCOMPLETE') return !u.isProfileComplete;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </span>
            Player & Profile ID Management
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit player Free Fire identities, Profile IDs, transaction ledgers, adjust balances, and enforce instant account bans.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Players</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Profile ID (e.g. PID-1001), IGN, UID, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'INCOMPLETE', 'BANNED'].map((st) => (
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
          <span className="text-xs font-medium text-slate-400 ml-2">
            <strong>{filteredUsers.length}</strong> players
          </span>
        </div>
      </div>

      {/* Players Table in Light Theme */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Free Fire UID</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Loading player directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const bal = u.wallet?.availableBalance ?? 0;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{u.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-black text-xs border border-blue-200">
                            {u.profileId || (u.id ? `PID-${u.id.replace(/\D/g, '') || '1001'}` : 'PID-1001')}
                          </span>
                          <button
                            onClick={() => copyToClipboard(u.profileId || `PID-${u.id.replace(/\D/g, '') || '1001'}`, `pid_${u.id}`)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy Profile ID"
                          >
                            {copiedKey === `pid_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                          <span>{u.ffUid || 'Pending'}</span>
                          {u.ffUid && (
                            <button
                              onClick={() => copyToClipboard(u.ffUid, `ffuid_${u.id}`)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy Free Fire UID"
                            >
                              {copiedKey === `ffuid_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-sm text-emerald-700 block">₹{bal}</span>
                        <button
                          onClick={() => handleWalletOpen(u)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-0.5"
                        >
                          <Wallet className="w-3 h-3" /> Adjust Funds
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="font-semibold text-slate-800">{u.phone || 'No phone'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          u.isBanned 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : (u.isProfileComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200')
                        }`}>
                          {u.isBanned ? 'Suspended' : (u.isProfileComplete ? 'Active' : 'Incomplete')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Inspect Ledger */}
                        <button
                          onClick={() => handleInspectOpen(u)}
                          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition"
                          title="Inspect Player Ledger & Matches"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Profile */}
                        <button
                          onClick={() => handleEditOpen(u)}
                          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition"
                          title="Edit Player Info"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Ban / Unban */}
                        <button
                          onClick={() => handleBanToggle(u.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition border inline-flex items-center gap-1.5 shadow-2xs ${
                            u.isBanned
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                          title={u.isBanned ? 'Unban Player' : 'Ban Player'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{u.isBanned ? 'Unban' : 'Ban Player'}</span>
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

      {/* EDIT USER MODAL IN LIGHT THEME */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-900">Edit Player Profile</h4>
              <button 
                onClick={() => setEditUserModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Update Free Fire identity and contact parameters for this user.</p>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Free Fire UID</label>
                <input
                  type="text"
                  value={editForm.ffUid}
                  onChange={e => setEditForm({ ...editForm, ffUid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-amber-800 text-xs font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL IN LIGHT THEME */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Adjust Player Wallet Balance
              </h4>
              <button 
                onClick={() => setWalletModalUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{walletModalUser.name}</span>
                <span className="text-slate-500 font-mono">UID: {walletModalUser.ffUid || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Current Balance</span>
                <span className="text-base font-black text-emerald-700">₹{walletModalUser.wallet?.availableBalance ?? 0}</span>
              </div>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletForm({ ...walletForm, type: 'CREDIT' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      walletForm.type === 'CREDIT'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Credit (Add Funds)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletForm({ ...walletForm, type: 'DEBIT' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      walletForm.type === 'DEBIT'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Debit (Deduct Funds)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={walletForm.amount}
                  onChange={e => setWalletForm({ ...walletForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base font-black focus:border-blue-600 outline-none"
                />
                <div className="flex gap-1.5 mt-2">
                  {['50', '100', '200', '500'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWalletForm({ ...walletForm, amount: val })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Ledger Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tournament reward, dispute resolution"
                  value={walletForm.reason}
                  onChange={e => setWalletForm({ ...walletForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition ${
                    walletForm.type === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT USER DETAILS & LEDGER MODAL IN LIGHT THEME */}
      {inspectUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black border border-indigo-200">
                  {inspectUserModal.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{inspectUserModal.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    FF UID: <span className="text-amber-800 font-bold">{inspectUserModal.ffUid || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectUserModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInspect ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading ledger and match records...</div>
            ) : inspectDetails ? (
              <div className="space-y-4">
                {/* Balance Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase">Available Balance</span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">₹{inspectDetails.wallet?.availableBalance || 0}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold uppercase">Pending Balance</span>
                    <p className="text-lg font-black text-amber-800 mt-0.5">₹{inspectDetails.wallet?.pendingBalance || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                    <span className="text-[10px] text-blue-800 font-bold uppercase">Total Winnings</span>
                    <p className="text-lg font-black text-blue-700 mt-0.5">₹{inspectDetails.wallet?.totalEarnings || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                    <span className="text-[10px] text-purple-800 font-bold uppercase">Cashouts Settled</span>
                    <p className="text-lg font-black text-purple-700 mt-0.5">₹{inspectDetails.wallet?.totalWithdrawals || 0}</p>
                  </div>
                </div>

                {/* Match Registrations */}
                <div>
                  <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Enrolled Tournaments ({inspectDetails.registrations?.length || 0})
                  </h5>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {inspectDetails.registrations?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-xl">No tournament entries yet.</p>
                    ) : (
                      inspectDetails.registrations?.map((r: any) => (
                        <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{r.match?.title || r.matchId}</span>
                            <span className="text-slate-500 ml-2 font-mono">Slot #{r.slotNumber}</span>
                          </div>
                          <span className="text-emerald-700 font-bold">Fee: ₹{r.entryFeePaid}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-600" />
                    Recent Wallet Transactions ({inspectDetails.transactions?.length || 0})
                  </h5>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {inspectDetails.transactions?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-xl">No wallet activity recorded yet.</p>
                    ) : (
                      inspectDetails.transactions?.slice(0, 15).map((tx: any) => (
                        <div key={tx.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-700">{tx.type}</span>
                            <span className="text-slate-500 ml-2">{tx.description}</span>
                          </div>
                          <span className={`font-black ${tx.type === 'DEPOSIT' || tx.type === 'MATCH_WINNING' || tx.type === 'BONUS' || tx.type === 'REFUND' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'DEPOSIT' || tx.type === 'MATCH_WINNING' || tx.type === 'BONUS' || tx.type === 'REFUND' ? '+' : '-'}₹{tx.amount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectUserModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

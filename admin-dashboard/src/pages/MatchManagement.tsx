import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Ban, 
  Trash2, 
  Users, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  Trophy,
  Edit3,
  UserPlus,
  UserMinus,
  X,
  Clock,
  MapPin,
  ExternalLink,
  LayoutGrid,
  ListOrdered,
  Minus,
  Wallet,
  DollarSign,
  Radio
} from 'lucide-react';
import { 
  fetchMatches, 
  createMatch, 
  updateMatch, 
  deleteMatch, 
  setRoomCredentials, 
  fetchMatchParticipants,
  kickMatchParticipant,
  addMatchParticipant,
  fetchUsers,
  submitMatchResults,
  subscribeToRealtimeEvents
} from '../api';

export const MatchManagement: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [roomModalMatch, setRoomModalMatch] = useState<any>(null);
  const [participantsModalMatch, setParticipantsModalMatch] = useState<any>(null);
  const [participantsList, setParticipantsList] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Roster View Mode & Quick Payout State
  const [rosterViewMode, setRosterViewMode] = useState<'GRID' | 'TABLE' | 'PAYOUT'>('GRID');
  const [rosterScores, setRosterScores] = useState<Record<string, { kills: number; rank: number | null }>>({});
  const [savingScores, setSavingScores] = useState(false);

  // Manual Add Player State
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [deductFeeOnAdd, setDeductFeeOnAdd] = useState(false);

  // Form State for Creating / Editing Match
  const [matchForm, setMatchForm] = useState({
    title: '',
    category: 'BATTLE_ROYALE',
    mode: 'SOLO',
    matchType: 'BOOYAH',
    map: 'Bermuda',
    entryFee: 20,
    prizePool: 500,
    firstPrize: 300,
    secondPrize: 150,
    thirdPrize: 50,
    perKillReward: 0,
    maxSlots: 48,
    matchDate: 'Nov 12, 2026',
    matchTime: '08:00 PM',
    rules: 'No PC/Emulators allowed.\nRoom ID given 15 mins prior.\nTeaming up in Solo leads to ban.',
    description: 'Compete in Free Fire tournament and win prizes.'
  });

  // Room Credentials State
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  const loadMatches = () => {
    setLoading(true);
    fetchMatches().then(res => {
      if (res.success) setMatches(res.matches);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMatches();

    const unsubscribe = subscribeToRealtimeEvents((event) => {
      loadMatches();
      if (participantsModalMatch && (event.type === 'MATCH_REGISTRATION' || event.type === 'PARTICIPANTS_UPDATED')) {
        fetchMatchParticipants(participantsModalMatch.id).then(res => {
          if (res.success && res.participants) setParticipantsList(res.participants);
        });
      }
    });

    return () => unsubscribe();
  }, [participantsModalMatch]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingMatch(null);
    setMatchForm({
      title: '',
      category: 'BATTLE_ROYALE',
      mode: 'SOLO',
      matchType: 'BOOYAH',
      map: 'Bermuda',
      entryFee: 20,
      prizePool: 500,
      firstPrize: 300,
      secondPrize: 150,
      thirdPrize: 50,
      perKillReward: 0,
      maxSlots: 48,
      matchDate: 'Nov 12, 2026',
      matchTime: '08:00 PM',
      rules: 'No PC/Emulators allowed.\nRoom ID given 15 mins prior.\nTeaming up in Solo leads to ban.',
      description: 'Compete in Free Fire tournament and win prizes.'
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingMatch(m);
    setMatchForm({
      title: m.title || '',
      category: m.category || 'BATTLE_ROYALE',
      mode: m.mode || 'SOLO',
      matchType: m.matchType || 'BOOYAH',
      map: m.map || 'Bermuda',
      entryFee: m.entryFee || 0,
      prizePool: m.prizePool || 0,
      firstPrize: m.firstPrize || 0,
      secondPrize: m.secondPrize || 0,
      thirdPrize: m.thirdPrize || 0,
      perKillReward: m.perKillReward || 0,
      maxSlots: m.maxSlots || 48,
      matchDate: m.matchDate || 'Nov 12, 2026',
      matchTime: m.matchTime || '08:00 PM',
      rules: Array.isArray(m.rules) ? m.rules.join('\n') : (m.rules || ''),
      description: m.description || ''
    });
    setShowCreateModal(true);
  };

  const handleMatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rulesList = matchForm.rules.split('\n').filter(r => r.trim().length > 0);
    const bannerUrl = `/shared-assets/${matchForm.map.toLowerCase().replace(/\s+/g, '_')}.jpg`;

    if (editingMatch) {
      const res = await updateMatch(editingMatch.id, {
        ...matchForm,
        bannerUrl,
        rules: rulesList
      });
      if (res.success) {
        setShowCreateModal(false);
        loadMatches();
        alert('Match parameters updated successfully!');
      } else {
        alert('Error: ' + res.message);
      }
    } else {
      const res = await createMatch({
        ...matchForm,
        bannerUrl,
        rules: rulesList
      });
      if (res.success) {
        setShowCreateModal(false);
        loadMatches();
        alert('Match deployed successfully!');
      } else {
        alert('Error: ' + res.message);
      }
    }
  };

  const handlePublishRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomModalMatch) return;

    const res = await setRoomCredentials(roomModalMatch.id, roomId, roomPassword);
    if (res.success) {
      setRoomModalMatch(null);
      setRoomId('');
      setRoomPassword('');
      loadMatches();
      alert('Room credentials published! All enrolled players received in-app notifications.');
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleStatusChange = async (matchId: string, status: string) => {
    const res = await updateMatch(matchId, { status });
    if (res.success) loadMatches();
  };

  // Real-time slot polling when participants modal is open
  useEffect(() => {
    if (!participantsModalMatch) return;
    const interval = setInterval(async () => {
      const res = await fetchMatchParticipants(participantsModalMatch.id);
      if (res.success && res.participants) {
        setParticipantsList(res.participants);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [participantsModalMatch]);

  const handleViewParticipants = async (match: any) => {
    setParticipantsModalMatch(match);
    setRosterViewMode('GRID');
    setLoadingParticipants(true);
    const res = await fetchMatchParticipants(match.id);
    if (res.success && res.participants) {
      setParticipantsList(res.participants);
      const initScores: Record<string, { kills: number; rank: number | null }> = {};
      res.participants.forEach((p: any) => {
        initScores[p.userId] = { kills: 0, rank: null };
      });
      setRosterScores(initScores);
    } else {
      setParticipantsList([]);
      setRosterScores({});
    }
    setLoadingParticipants(false);
  };

  const handleCopyAllUids = () => {
    if (!participantsList || participantsList.length === 0) return;
    const uids = participantsList.map(p => p.ffUid).filter(Boolean).join('\n');
    navigator.clipboard.writeText(uids);
    setCopiedKey('all_uids');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRosterKillChange = (userId: string, newKills: number) => {
    const kills = Math.max(0, newKills);
    setRosterScores(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { rank: null }),
        kills
      }
    }));
  };

  const handleRosterRankChange = (userId: string, rankVal: string) => {
    const rank = rankVal ? Number(rankVal) : null;
    setRosterScores(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { kills: 0 }),
        rank
      }
    }));
  };

  const handleSaveRosterPayouts = async () => {
    if (!participantsModalMatch || participantsList.length === 0) return;
    const match = participantsModalMatch;
    const perKillReward = Number(match.perKillReward || 0);

    const payload = participantsList.map(p => {
      const s = rosterScores[p.userId] || { kills: 0, rank: null };
      let placementPrize = 0;
      if (s.rank === 1) placementPrize = Number(match.firstPrize || match.prizePool || 0);
      else if (s.rank === 2) placementPrize = Number(match.secondPrize || 0);
      else if (s.rank === 3) placementPrize = Number(match.thirdPrize || 0);

      const killReward = (s.kills || 0) * perKillReward;
      const totalReward = placementPrize + killReward;

      return {
        userId: p.userId,
        ign: p.ign || 'Player',
        ffUid: p.ffUid || 'N/A',
        rank: s.rank,
        kills: s.kills || 0,
        reward: totalReward
      };
    });

    const totalToDisburse = payload.reduce((sum, r) => sum + r.reward, 0);
    const winnersCount = payload.filter(r => r.reward > 0).length;

    if (!confirm(`Confirm prize payout of ₹${totalToDisburse} to ${winnersCount} players and mark "${match.title}" as COMPLETED?`)) return;

    setSavingScores(true);
    try {
      const res = await submitMatchResults(match.id, payload);
      if (res.success) {
        alert(`Success! ${res.message || `₹${totalToDisburse} credited to winners successfully.`}`);
        setParticipantsModalMatch(null);
        loadMatches();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSavingScores(false);
    }
  };

  const handleDeleteMatch = async (match: any) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${match.title}"? Any registered players will receive automatic refunds of their entry fees.`)) {
      return;
    }
    const res = await deleteMatch(match.id);
    if (res.success) {
      alert(res.message || 'Match cancelled and entry fees refunded.');
      loadMatches();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleKickParticipant = async (userId: string) => {
    if (!participantsModalMatch) return;
    if (!confirm('Are you sure you want to remove this player? Their entry fee will be refunded.')) return;

    const res = await kickMatchParticipant(participantsModalMatch.id, userId);
    if (res.success) {
      alert(res.message);
      const partRes = await fetchMatchParticipants(participantsModalMatch.id);
      if (partRes.success) setParticipantsList(partRes.participants || []);
      loadMatches();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleOpenAddPlayer = async () => {
    const res = await fetchUsers();
    if (res.success && res.users) {
      setAvailableUsers(res.users);
      if (res.users.length > 0) setSelectedUserIdToAdd(res.users[0].id);
      setShowAddPlayerModal(true);
    }
  };

  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantsModalMatch || !selectedUserIdToAdd) return;

    const res = await addMatchParticipant(participantsModalMatch.id, selectedUserIdToAdd, deductFeeOnAdd);
    if (res.success) {
      alert('Player enrolled into match successfully!');
      setShowAddPlayerModal(false);
      const partRes = await fetchMatchParticipants(participantsModalMatch.id);
      if (partRes.success) setParticipantsList(partRes.participants || []);
      loadMatches();
    } else {
      alert('Error: ' + res.message);
    }
  };

  const filteredMatches = matches.filter(m => {
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchCodeStr = m.matchCode || m.id || '';
    const matchSearch = !searchQuery || 
      matchCodeStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      m.map.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filters in Light Theme */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Plus className="w-5 h-5 text-blue-600" />
            </span>
            Match Operations & Roster Control
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Deploy matches, broadcast Free Fire room credentials, manage player slots, and inspect squad rosters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadMatches}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Match</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'].map((tab) => {
            const count = tab === 'ALL' ? matches.length : matches.filter(m => m.status === tab).length;
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Match ID (e.g. M-101), Map, or Mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Match Table Card in Light Theme */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Match Info</th>
                <th className="py-3.5 px-4">Mode / Map</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Entry / Prize</th>
                <th className="py-3.5 px-4">Slots Filled</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Room Credentials</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading matches...
                  </td>
                </tr>
              ) : filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No matches found matching filter.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-black text-xs border border-blue-200">
                          {m.matchCode || `M-${m.id.replace(/\D/g, '').slice(-3) || '101'}`}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">{m.map} • {m.mode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{m.mode}</span>
                      <span className="text-slate-500 block text-[11px]">{m.map}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        m.matchType === 'BOOYAH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {m.matchType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">Fee: ₹{m.entryFee}</div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        {m.matchType === 'KILL' ? `₹${m.perKillReward}/Kill` : `Pool: ₹${m.prizePool}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">{m.registeredCount} / {m.maxSlots}</span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.registeredCount >= m.maxSlots ? 'bg-amber-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, (m.registeredCount / m.maxSlots) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div>{m.matchDate}</div>
                      <div className="font-bold text-slate-800">{m.matchTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        m.status === 'UPCOMING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        m.status === 'LIVE' ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse' :
                        m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {m.roomId ? (
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs">
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ID: {m.roomId}
                            </span>
                            <div className="font-mono text-slate-500 text-[10px] mt-0.5">P: {m.roomPassword || 'None'}</div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(`ID: ${m.roomId} Pass: ${m.roomPassword || 'None'}`, `r_${m.id}`)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                          >
                            {copiedKey === `r_${m.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 italic font-semibold">Pending Release</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Roster button */}
                      <button
                        onClick={() => handleViewParticipants(m)}
                        className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition"
                        title="View Roster"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      {/* Release Room button (Yellow) */}
                      <button
                        onClick={() => {
                          setRoomModalMatch(m);
                          setRoomId(m.roomId || '');
                          setRoomPassword(m.roomPassword || '');
                        }}
                        className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition"
                        title="Set Room ID & Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Start / Set LIVE (Green) */}
                      {m.status === 'UPCOMING' && (
                        <button
                          onClick={() => handleStatusChange(m.id, 'LIVE')}
                          className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                          title="Set Match LIVE"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {/* Mark Completed (Blue) */}
                      {m.status === 'LIVE' && (
                        <button
                          onClick={() => handleStatusChange(m.id, 'COMPLETED')}
                          className="p-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                          title="Mark Match Completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Edit Match (Indigo) */}
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition"
                        title="Edit Match Parameters"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete / Cancel & Refund (Red) */}
                      <button
                        onClick={() => handleDeleteMatch(m)}
                        className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
                        title="Cancel Match & Auto-Refund"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MATCH MODAL IN LIGHT THEME */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-black text-slate-900">
                {editingMatch ? `Edit Match: ${editingMatch.matchCode || editingMatch.id}` : 'Deploy New Free Fire Tournament Match'}
              </h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Configure match format, map, prizes, slots, and guidelines.</p>
            
            <form onSubmit={handleMatchFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unique Match ID</label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-mono font-black flex items-center justify-between">
                  <span>{editingMatch ? (editingMatch.matchCode || editingMatch.id) : 'Auto-generated Unique Match ID (e.g. M-101)'}</span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">System Assigned</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Map</label>
                  <select
                    value={matchForm.map}
                    onChange={e => setMatchForm({ ...matchForm, map: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Solara">Solara</option>
                    <option value="Nexterra">Nexterra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={matchForm.mode}
                    onChange={e => setMatchForm({ ...matchForm, mode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  >
                    <option value="SOLO">SOLO</option>
                    <option value="DUO">DUO</option>
                    <option value="SQUAD">SQUAD</option>
                    <option value="1V1">1V1</option>
                    <option value="2V2">2V2</option>
                    <option value="4V4">4V4</option>
                    <option value="6V6">6V6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Match Type</label>
                  <select
                    value={matchForm.matchType}
                    onChange={e => setMatchForm({ ...matchForm, matchType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  >
                    <option value="BOOYAH">BOOYAH (Placement Based)</option>
                    <option value="KILL">KILL (Per-Kill Based)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Slots</label>
                  <input
                    type="number"
                    value={matchForm.maxSlots}
                    onChange={e => setMatchForm({ ...matchForm, maxSlots: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    value={matchForm.entryFee}
                    onChange={e => setMatchForm({ ...matchForm, entryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prize Pool (₹)</label>
                  <input
                    type="number"
                    value={matchForm.prizePool}
                    onChange={e => setMatchForm({ ...matchForm, prizePool: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {matchForm.matchType === 'KILL' ? 'Per Kill (₹)' : '1st Prize (₹)'}
                  </label>
                  <input
                    type="number"
                    value={matchForm.matchType === 'KILL' ? matchForm.perKillReward : matchForm.firstPrize}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (matchForm.matchType === 'KILL') {
                        setMatchForm({ ...matchForm, perKillReward: val });
                      } else {
                        setMatchForm({ ...matchForm, firstPrize: val });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Match Date</label>
                  <input
                    type="text"
                    value={matchForm.matchDate}
                    onChange={e => setMatchForm({ ...matchForm, matchDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Match Time</label>
                  <input
                    type="text"
                    value={matchForm.matchTime}
                    onChange={e => setMatchForm({ ...matchForm, matchTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Match Rules (1 per line)</label>
                <textarea
                  rows={2}
                  value={matchForm.rules}
                  onChange={e => setMatchForm({ ...matchForm, rules: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  {editingMatch ? 'Update Match' : 'Deploy Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM CREDENTIALS MODAL IN LIGHT THEME */}
      {roomModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Broadcast Room Credentials
              </h4>
              <button 
                onClick={() => setRoomModalMatch(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter Custom Room ID & Password created inside Free Fire for <strong>{roomModalMatch.title}</strong>.
            </p>

            <form onSubmit={handlePublishRoom} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Custom Room ID</label>
                  <button
                    type="button"
                    onClick={() => setRoomId(Math.floor(1000000 + Math.random() * 9000000).toString())}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7482910"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-amber-900 text-sm font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Room Password</label>
                  <button
                    type="button"
                    onClick={() => setRoomPassword('1234')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    Set "1234"
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1234 or leave blank"
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-mono font-bold focus:border-blue-600 outline-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 font-medium">
                Publishing will notify all registered players on their Android app match screen instantly.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRoomModalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition"
                >
                  Broadcast Room ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL-TIME 48-SLOT ROSTER & TOURNAMENT DESK MODAL */}
      {participantsModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 space-y-4">
            
            {/* Header: Title, Slot Fill Progress & Live Auto-Polling Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <Users className="w-5 h-5" />
                  </span>
                  <h4 className="text-lg font-black text-slate-900">{participantsModalMatch.matchCode || participantsModalMatch.id} ({participantsModalMatch.map} • {participantsModalMatch.mode})</h4>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync (4s)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {participantsModalMatch.mode} • {participantsModalMatch.map} • Start: <strong className="text-slate-800">{participantsModalMatch.matchDate} {participantsModalMatch.matchTime}</strong> • {participantsModalMatch.matchType} Match
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyAllUids}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-200"
                  title="Copy all joined player Free Fire UIDs"
                >
                  {copiedKey === 'all_uids' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'all_uids' ? 'Copied All UIDs!' : 'Copy All UIDs'}</span>
                </button>

                <button
                  onClick={handleOpenAddPlayer}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Player</span>
                </button>

                {participantsModalMatch.status === 'UPCOMING' && (
                  <button
                    onClick={() => {
                      handleStatusChange(participantsModalMatch.id, 'LIVE');
                      setParticipantsModalMatch((prev: any) => ({ ...prev, status: 'LIVE' }));
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Go Live Now</span>
                  </button>
                )}

                <button
                  onClick={() => setParticipantsModalMatch(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 48-Slot Capacity Bar */}
            {(() => {
              const maxSlots = participantsModalMatch.maxSlots || 48;
              const filled = participantsList.length;
              const fillPct = Math.min(100, Math.round((filled / maxSlots) * 100));
              const isFull = filled >= maxSlots;

              return (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span>Roster Capacity:</span>
                      <strong className="text-slate-900 font-black">{filled} / {maxSlots} Slots Filled</strong>
                    </span>
                    <span className={isFull ? 'text-emerald-700 font-extrabold flex items-center gap-1' : 'text-blue-700 font-mono'}>
                      {isFull && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isFull ? 'MATCH SLOTS FULL (48/48) — READY FOR ROOM RELEASE!' : `${fillPct}% Filled`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Navigation View Switcher (Grid vs Table vs Scores) */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setRosterViewMode('GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    rosterViewMode === 'GRID' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>48-Slot Matrix</span>
                </button>

                <button
                  onClick={() => setRosterViewMode('TABLE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    rosterViewMode === 'TABLE' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Roster List ({participantsList.length})</span>
                </button>

                <button
                  onClick={() => setRosterViewMode('PAYOUT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    rosterViewMode === 'PAYOUT' ? 'bg-amber-500 text-white shadow-2xs font-black' : 'text-slate-600 hover:text-amber-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Score & Payout Desk</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Match ID: {participantsModalMatch.id}
              </span>
            </div>

            {/* VIEW 1: INTERACTIVE 48-SLOT MATRIX */}
            {rosterViewMode === 'GRID' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[55vh] overflow-y-auto p-1">
                  {Array.from({ length: participantsModalMatch.maxSlots || 48 }, (_, i) => i + 1).map((slotNum) => {
                    const participant = participantsList.find(p => p.slotNumber === slotNum) || participantsList[slotNum - 1];
                    const isOccupied = Boolean(participant);

                    if (isOccupied) {
                      return (
                        <div 
                          key={slotNum}
                          className="bg-blue-50/50 border border-blue-200 rounded-2xl p-2.5 flex flex-col justify-between space-y-2 hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                              #{slotNum}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                              Joined
                            </span>
                          </div>

                          <div>
                            <div className="font-extrabold text-slate-900 text-xs truncate" title={participant.ign}>
                              {participant.ign || participant.userName}
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-amber-800 font-bold mt-0.5 truncate">
                              <span>{participant.ffUid}</span>
                              <button
                                onClick={() => copyToClipboard(participant.ffUid, `grid_uid_${slotNum}`)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                {copiedKey === `grid_uid_${slotNum}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-blue-100 text-[10px]">
                            <span className="font-bold text-slate-600">₹{participant.walletBalance || 0}</span>
                            <button
                              onClick={() => handleKickParticipant(participant.userId)}
                              className="text-rose-600 hover:text-rose-800 p-0.5 rounded"
                              title="Kick player & refund fee"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={slotNum}
                        onClick={handleOpenAddPlayer}
                        className="border border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center space-y-1 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition min-h-[95px] group"
                      >
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-800 font-bold text-[10px] flex items-center justify-center">
                          #{slotNum}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600">
                          Open Slot
                        </span>
                        <span className="text-[9px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">
                          + Enroll
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: FULL TABLE OF REGISTERED PLAYERS */}
            {rosterViewMode === 'TABLE' && (
              <div className="overflow-x-auto max-h-[55vh] border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-3.5">Slot #</th>
                      <th className="py-3 px-3.5">Player Name</th>
                      <th className="py-3 px-3.5">Free Fire UID</th>
                      <th className="py-3 px-3.5">Wallet Balance</th>
                      <th className="py-3 px-3.5">Entry Fee Paid</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participantsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No players registered yet.
                        </td>
                      </tr>
                    ) : (
                      participantsList.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3.5 font-bold font-mono text-slate-500">#{p.slotNumber || idx + 1}</td>
                          <td className="py-3 px-3.5">
                            <span className="font-extrabold text-slate-900 block">{p.userName || p.name || 'Player'}</span>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-800">
                              <span>{p.ffUid}</span>
                              <button onClick={() => copyToClipboard(p.ffUid, `t_uid_${idx}`)} className="text-slate-400 hover:text-slate-700">
                                {copiedKey === `t_uid_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-800">₹{p.walletBalance || 0}</td>
                          <td className="py-3 px-3.5 font-bold text-emerald-700">₹{p.entryFeePaid}</td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              onClick={() => handleKickParticipant(p.userId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] transition inline-flex items-center gap-1"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>Kick & Refund</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 3: SCORE ENTRY & INSTANT PRIZE PAYOUT DESK */}
            {rosterViewMode === 'PAYOUT' && (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-black block">Manual Match Outcome Verification</span>
                    <span>
                      {participantsModalMatch.matchType === 'KILL'
                        ? `Kill Tournament: Each kill awards ₹${participantsModalMatch.perKillReward || 0} directly to player wallets.`
                        : `Booyah Tournament: Rank 1 awards ₹${participantsModalMatch.firstPrize || participantsModalMatch.prizePool || 0}, Rank 2 awards ₹${participantsModalMatch.secondPrize || 0}, Rank 3 awards ₹${participantsModalMatch.thirdPrize || 0}.`}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-xl">
                    Pool: ₹{participantsModalMatch.prizePool}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {participantsList.map((p, idx) => {
                    const score = rosterScores[p.userId] || { kills: 0, rank: null };
                    let placementPrize = 0;
                    if (score.rank === 1) placementPrize = Number(participantsModalMatch.firstPrize || participantsModalMatch.prizePool || 0);
                    else if (score.rank === 2) placementPrize = Number(participantsModalMatch.secondPrize || 0);
                    else if (score.rank === 3) placementPrize = Number(participantsModalMatch.thirdPrize || 0);

                    const killReward = (score.kills || 0) * Number(participantsModalMatch.perKillReward || 0);
                    const totalReward = placementPrize + killReward;

                    return (
                      <div key={p.id || idx} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                            #{p.slotNumber || idx + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{p.ign || p.userName}</div>
                            <div className="text-[11px] text-slate-500">
                              UID: <strong className="font-mono text-amber-800">{p.ffUid}</strong> • Wallet: ₹{p.walletBalance || 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Booyah Placement Selector */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Placement</label>
                            <select
                              value={score.rank || ''}
                              onChange={(e) => handleRosterRankChange(p.userId, e.target.value)}
                              className={`px-2 py-1 rounded-xl border text-xs font-bold outline-none ${
                                score.rank === 1 ? 'bg-amber-500 text-white border-amber-600' :
                                score.rank === 2 ? 'bg-blue-600 text-white border-blue-700' :
                                score.rank === 3 ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <option value="">No Placement</option>
                              <option value="1">🏆 1st (Booyah)</option>
                              <option value="2">🥈 2nd Place</option>
                              <option value="3">🥉 3rd Place</option>
                            </select>
                          </div>

                          {/* Kills Counter */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Kills</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRosterKillChange(p.userId, (score.kills || 0) - 1)}
                                className="w-6 h-6 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={score.kills || 0}
                                onChange={(e) => handleRosterKillChange(p.userId, Number(e.target.value))}
                                className="w-10 text-center font-black bg-slate-50 border border-slate-200 rounded py-0.5 text-xs outline-none"
                              />
                              <button
                                onClick={() => handleRosterKillChange(p.userId, (score.kills || 0) + 1)}
                                className="w-6 h-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Computed Reward */}
                          <div className="text-right min-w-[90px]">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Calculated Payout</label>
                            <span className={`font-black text-sm ${totalReward > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              ₹{totalReward}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveRosterPayouts}
                    disabled={savingScores || participantsList.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{savingScores ? 'Disbursing...' : 'Save Results & Credit Wallets'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {participantsList.length} registered players in roster
              </span>
              <button
                type="button"
                onClick={() => setParticipantsModalMatch(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                Close Roster Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ENROLL MODAL IN LIGHT THEME */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Enroll Player into Match
              </h4>
              <button 
                onClick={() => setShowAddPlayerModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlayerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Player</label>
                <select
                  value={selectedUserIdToAdd}
                  onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold outline-none focus:border-blue-600"
                >
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.ign || 'No IGN'} • {u.ffUid || 'No UID'}) - {u.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Deduct Match Entry Fee</span>
                  <span className="text-slate-500">Debit ₹{participantsModalMatch?.entryFee || 0} from player's wallet</span>
                </div>
                <input
                  type="checkbox"
                  checked={deductFeeOnAdd}
                  onChange={(e) => setDeductFeeOnAdd(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

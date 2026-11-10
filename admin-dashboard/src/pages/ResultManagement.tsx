import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Wallet, 
  Gamepad2, 
  Award,
  Zap,
  Eye,
  DollarSign
} from 'lucide-react';
import { fetchMatches, fetchMatchParticipants, submitMatchResults } from '../api';

interface PlayerRowState {
  userId: string;
  userName: string;
  ign: string;
  ffUid: string;
  walletBalance: number;
  matchesPlayed: number;
  totalKills: number;
  totalEarnings: number;
  slotNumber: number;
  entryFeePaid: number;
  rank: number | null; // 1, 2, 3 or null
  placementPrize: number;
  kills: number;
  killReward: number;
  totalReward: number;
}

export const ResultManagement: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Player Rows for Score Verification
  const [playerRows, setPlayerRows] = useState<PlayerRowState[]>([]);
  
  // Optional in-game scoreboard comparator note
  const [scoreboardNotes, setScoreboardNotes] = useState('');
  const [showScoreboardComparator, setShowScoreboardComparator] = useState(false);

  useEffect(() => {
    loadMatchesList();
  }, []);

  const loadMatchesList = async () => {
    setLoading(true);
    try {
      const res = await fetchMatches();
      if (res.success && res.matches?.length > 0) {
        setMatches(res.matches);
        // Find first upcoming or live match
        const active = res.matches.find((m: any) => m.status === 'LIVE' || m.status === 'UPCOMING') || res.matches[0];
        setSelectedMatchId(active.id);
        loadMatchPlayers(active.id, active);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchPlayers = async (matchId: string, currentMatch?: any) => {
    setLoadingParticipants(true);
    const m = currentMatch || matches.find(item => item.id === matchId);
    try {
      const res = await fetchMatchParticipants(matchId);
      if (res.success && res.participants) {
        const rows: PlayerRowState[] = res.participants.map((p: any, idx: number) => {
          const kills = 0;
          const perKill = Number(m?.perKillReward || 0);
          const killReward = kills * perKill;
          return {
            userId: p.userId,
            userName: p.userName || p.ign,
            ign: p.ign || 'Player',
            ffUid: p.ffUid || 'N/A',
            walletBalance: p.walletBalance || 0,
            matchesPlayed: p.matchesPlayed || 0,
            totalKills: p.totalKills || 0,
            totalEarnings: p.totalEarnings || 0,
            slotNumber: p.slotNumber || idx + 1,
            entryFeePaid: p.entryFeePaid || 0,
            rank: null,
            placementPrize: 0,
            kills: 0,
            killReward: 0,
            totalReward: 0
          };
        });
        setPlayerRows(rows);
      } else {
        setPlayerRows([]);
      }
    } catch {
      setPlayerRows([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    const m = matches.find(item => item.id === matchId);
    loadMatchPlayers(matchId, m);
  };

  // Update Kills for a player
  const handleKillsChange = (userId: string, newKills: number) => {
    if (!selectedMatch) return;
    const kills = Math.max(0, newKills);
    const perKillReward = Number(selectedMatch.perKillReward || 0);
    const killReward = kills * perKillReward;

    setPlayerRows(prev => prev.map(row => {
      if (row.userId !== userId) return row;
      const totalReward = row.placementPrize + killReward;
      return {
        ...row,
        kills,
        killReward,
        totalReward
      };
    }));
  };

  // Update Placement Rank for a player
  const handleRankChange = (userId: string, rankValue: string) => {
    if (!selectedMatch) return;
    const rank = rankValue ? Number(rankValue) : null;
    let placementPrize = 0;

    if (rank === 1) placementPrize = Number(selectedMatch.firstPrize || selectedMatch.prizePool || 0);
    else if (rank === 2) placementPrize = Number(selectedMatch.secondPrize || 0);
    else if (rank === 3) placementPrize = Number(selectedMatch.thirdPrize || 0);

    setPlayerRows(prev => prev.map(row => {
      if (row.userId !== userId) return row;
      const totalReward = placementPrize + row.killReward;
      return {
        ...row,
        rank,
        placementPrize,
        totalReward
      };
    }));
  };

  // Update Custom Placement Prize
  const handlePlacementPrizeChange = (userId: string, prize: number) => {
    const placementPrize = Math.max(0, prize);
    setPlayerRows(prev => prev.map(row => {
      if (row.userId !== userId) return row;
      const totalReward = placementPrize + row.killReward;
      return {
        ...row,
        placementPrize,
        totalReward
      };
    }));
  };

  // Quick preset: assign Top 3 automatically from first 3 rows
  const autoAssignTop3 = () => {
    if (!selectedMatch || playerRows.length === 0) return;
    setPlayerRows(prev => prev.map((row, idx) => {
      if (idx === 0) {
        const prize = Number(selectedMatch.firstPrize || selectedMatch.prizePool || 0);
        return { ...row, rank: 1, placementPrize: prize, totalReward: prize + row.killReward };
      }
      if (idx === 1) {
        const prize = Number(selectedMatch.secondPrize || 0);
        return { ...row, rank: 2, placementPrize: prize, totalReward: prize + row.killReward };
      }
      if (idx === 2) {
        const prize = Number(selectedMatch.thirdPrize || 0);
        return { ...row, rank: 3, placementPrize: prize, totalReward: prize + row.killReward };
      }
      return row;
    }));
  };

  // Submit and Disburse
  const handleSubmitResults = async () => {
    if (!selectedMatch) return;
    if (playerRows.length === 0) {
      alert('There are no registered players in this match to distribute rewards to.');
      return;
    }

    const totalToDisburse = playerRows.reduce((sum, r) => sum + r.totalReward, 0);
    const winningPlayersCount = playerRows.filter(r => r.totalReward > 0).length;

    const confirmMsg = `Review Result & Instant Wallet Credit:
Match: ${selectedMatch.title}
Winning Players: ${winningPlayersCount}
Total Disbursed: ₹${totalToDisburse}

Proceed to credit player wallets and mark match COMPLETED?`;

    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const payload = playerRows.map(r => ({
        userId: r.userId,
        ign: r.ign,
        ffUid: r.ffUid,
        rank: r.rank,
        kills: r.kills,
        reward: r.totalReward
      }));

      const res = await submitMatchResults(selectedMatch.id, payload);
      if (res.success) {
        alert(`Success! ${res.message || `₹${totalToDisburse} credited to winners successfully.`}`);
        loadMatchesList();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for top summary
  const totalKillsRecorded = playerRows.reduce((sum, r) => sum + r.kills, 0);
  const totalPayoutCalculated = playerRows.reduce((sum, r) => sum + r.totalReward, 0);
  const winnersCount = playerRows.filter(r => r.totalReward > 0).length;

  const filteredMatches = matches.filter(m => {
    if (matchStatusFilter === 'ALL') return true;
    return m.status === matchStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
            Manual Match Completion & Score Verification Desk
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cross-reference in-game Free Fire results against enrolled player UIDs, input kills, and execute automated wallet credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScoreboardComparator(!showScoreboardComparator)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>{showScoreboardComparator ? 'Hide Game Comparator' : 'In-Game Comparator'}</span>
          </button>
          <button
            onClick={loadMatchesList}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Match Selector & Status Pill Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Matches:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'].map(st => (
                <button
                  key={st}
                  onClick={() => setMatchStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    matchStatusFilter === st 
                      ? 'bg-white text-blue-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-96">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Match To Declare Rewards:
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => handleMatchSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none focus:border-blue-600 focus:bg-white transition"
            >
              {filteredMatches.map(m => (
                <option key={m.id} value={m.id}>
                  [{m.status}] {m.title} ({m.mode} • {m.map}) — Pool: ₹{m.prizePool} / Kill: ₹{m.perKillReward}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Match Specs Banner */}
        {selectedMatch && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-100">
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Mode & Map</span>
              <span className="text-xs font-extrabold text-blue-900">{selectedMatch.mode} • {selectedMatch.map}</span>
            </div>

            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/60 rounded-xl">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">Match Type</span>
              <span className="text-xs font-extrabold text-indigo-900">{selectedMatch.matchType}</span>
            </div>

            <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Total Prize Pool</span>
              <span className="text-xs font-extrabold text-amber-900">₹{selectedMatch.prizePool}</span>
            </div>

            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Per Kill Rate</span>
              <span className="text-xs font-extrabold text-emerald-900">₹{selectedMatch.perKillReward || 0} / Kill</span>
            </div>

            <div className="p-2.5 bg-purple-50/70 border border-purple-200/60 rounded-xl">
              <span className="text-[10px] font-bold text-purple-700 uppercase block">1st Prize (Booyah)</span>
              <span className="text-xs font-extrabold text-purple-900">₹{selectedMatch.firstPrize || 0}</span>
            </div>

            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Registered Slots</span>
              <span className="text-xs font-extrabold text-slate-800">{playerRows.length} / {selectedMatch.maxSlots}</span>
            </div>

            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Match Status</span>
              <span className="text-xs font-black text-rose-700 uppercase">{selectedMatch.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side In-Game Scoreboard Comparator Tool */}
      {showScoreboardComparator && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-blue-600" />
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">
                Free Fire In-Game Scoreboard & Screenshot Notepad
              </h4>
            </div>
            <span className="text-[11px] text-blue-700 font-semibold">Paste raw match scoreboard notes or screenshot link below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Paste In-Game Score / Notes from Free Fire Room:</label>
              <textarea
                rows={3}
                value={scoreboardNotes}
                onChange={(e) => setScoreboardNotes(e.target.value)}
                placeholder="Example:
1. Roshan_Boss - 7 Kills - Booyah
2. SniperKing - 5 Kills - Rank 2
3. AssaultPro - 2 Kills"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
            <div className="bg-white/90 p-3 rounded-xl border border-blue-200/80 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-blue-900 block">💡 Operator Verification Instructions:</span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li>Look at the player's <strong>In-Game Name (IGN)</strong> and <strong>Free Fire UID</strong> below.</li>
                <li>Compare with your Free Fire match screenshot or results log.</li>
                <li>Press <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-bold">+</span> or type the kills. The reward adds automatically!</li>
                <li>Select <strong>Booyah (Rank 1)</strong>, <strong>Rank 2</strong>, or <strong>Rank 3</strong> to auto-fill rank rewards.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Roster & Score Verification Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Controls & Batch Tools */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Enrolled Competitors Roster:</span>
            <span className="bg-blue-100 text-blue-700 font-black text-xs px-2.5 py-0.5 rounded-full border border-blue-200">
              {playerRows.length} Players
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={autoAssignTop3}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs"
              title="Automatically assign Rank 1, 2, and 3 prizes to top slots"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Auto-Assign Podium (Top 3)</span>
            </button>

            <button
              onClick={() => {
                setPlayerRows(prev => prev.map(r => ({
                  ...r,
                  rank: null,
                  placementPrize: 0,
                  kills: 0,
                  killReward: 0,
                  totalReward: 0
                })));
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition shadow-2xs"
            >
              Reset Scores
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Slot</th>
                <th className="py-3.5 px-4">Player & History</th>
                <th className="py-3.5 px-4">Free Fire UID</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Placement / Rank</th>
                <th className="py-3.5 px-4 text-center">Kills Counter</th>
                <th className="py-3.5 px-4 text-center">Kill Reward</th>
                <th className="py-3.5 px-4 text-right">Total Payout (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingParticipants ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading player roster...
                  </td>
                </tr>
              ) : playerRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No players registered in this match yet.
                  </td>
                </tr>
              ) : (
                playerRows.map((row, idx) => {
                  const hasPrize = row.totalReward > 0;
                  return (
                    <tr 
                      key={row.userId || idx} 
                      className={`hover:bg-slate-50/70 transition-colors ${hasPrize ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* Slot # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                          #{row.slotNumber}
                        </span>
                      </td>

                      {/* Player info, IGN & History */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className="text-blue-700 font-bold">{row.ign}</span>
                          <button
                            onClick={() => copyToClipboard(row.ign, `ign_${row.userId}`)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Copy IGN"
                          >
                            {copiedKey === `ign_${row.userId}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>{row.userName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-600 font-semibold">{row.totalKills} Kills</span>
                          <span className="text-slate-300">•</span>
                          <span>{row.matchesPlayed} Matches</span>
                        </div>
                      </td>

                      {/* Free Fire UID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 w-fit">
                          <span className="text-amber-800">{row.ffUid}</span>
                          <button
                            onClick={() => copyToClipboard(row.ffUid, `uid_${row.userId}`)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy UID"
                          >
                            {copiedKey === `uid_${row.userId}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Live Wallet Balance */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>₹{row.walletBalance}</span>
                          </div>
                          {row.totalReward > 0 ? (
                            <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
                              <span>+₹{row.totalReward}</span>
                              <span className="text-slate-400 font-normal">→ ₹{row.walletBalance + row.totalReward}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Available</div>
                          )}
                        </div>
                      </td>

                      {/* Rank Selection & Placement Prize */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={row.rank || ''}
                            onChange={(e) => handleRankChange(row.userId, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold outline-none transition ${
                              row.rank === 1
                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                : row.rank === 2
                                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                : row.rank === 3
                                ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="">No Placement</option>
                            <option value="1">🏆 Rank 1 (Booyah)</option>
                            <option value="2">🥈 Rank 2 (Runner-Up)</option>
                            <option value="3">🥉 Rank 3 (3rd Place)</option>
                            <option value="4">Rank 4</option>
                            <option value="5">Rank 5</option>
                          </select>

                          {row.rank && (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400">₹</span>
                              <input
                                type="number"
                                value={row.placementPrize}
                                onChange={(e) => handlePlacementPrizeChange(row.userId, Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                                title="Custom placement prize"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Kills Counter with + / - buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleKillsChange(row.userId, row.kills - 1)}
                            className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center justify-center font-black transition active:scale-95"
                            title="Decrease kill"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={row.kills}
                            onChange={(e) => handleKillsChange(row.userId, Number(e.target.value))}
                            className="w-12 py-1 text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                          />

                          <button
                            type="button"
                            onClick={() => handleKillsChange(row.userId, row.kills + 1)}
                            className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center justify-center font-black transition active:scale-95"
                            title="Add kill"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick kill tags */}
                          <div className="hidden lg:flex items-center gap-1 ml-1">
                            {[1, 2, 5].map(k => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => handleKillsChange(row.userId, row.kills + k)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 border border-slate-200"
                              >
                                +{k}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Kill Reward */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-700">
                          {row.kills > 0 ? (
                            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{row.kills} × ₹{selectedMatch?.perKillReward || 0} = ₹{row.killReward}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </span>
                      </td>

                      {/* Total Payout */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-sm font-black ${hasPrize ? 'text-emerald-600' : 'text-slate-400'}`}>
                          ₹{row.totalReward}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Payout Summary & Execution Action Bar */}
        <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Total Kills Recorded</span>
              <span className="text-base font-black text-blue-700">{totalKillsRecorded} Kills</span>
            </div>

            <div className="border-l border-slate-200 pl-4 sm:pl-6">
              <span className="text-slate-500 font-semibold block">Prize Recipients</span>
              <span className="text-base font-black text-amber-600">{winnersCount} Players</span>
            </div>

            <div className="border-l border-slate-200 pl-4 sm:pl-6">
              <span className="text-slate-500 font-semibold block">Total Payout Disbursed</span>
              <span className="text-xl font-black text-emerald-600">₹{totalPayoutCalculated.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSubmitResults}
              disabled={submitting || playerRows.length === 0}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 uppercase tracking-wider transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Crediting Wallets...' : `Confirm & Credit ₹${totalPayoutCalculated} to Players`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

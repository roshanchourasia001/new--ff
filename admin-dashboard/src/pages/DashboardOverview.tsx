import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Gamepad2, 
  Trophy, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Flame, 
  PlusCircle, 
  Key, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  Award,
  Zap,
  DollarSign,
  Play,
  RefreshCw,
  Copy,
  Check,
  Megaphone,
  Radio,
  Send,
  X
} from 'lucide-react';
import { 
  fetchMetrics, 
  fetchMatches, 
  fetchWithdrawals, 
  updateMatch, 
  fetchMatchParticipants,
  broadcastNotification,
  subscribeToRealtimeEvents
} from '../api';

interface DashboardOverviewProps {
  onNavigateTab?: (tab: string, meta?: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Roster Modal on Dashboard
  const [inspectMatch, setInspectMatch] = useState<any | null>(null);
  const [inspectParticipants, setInspectParticipants] = useState<any[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Quick Broadcast Announcement
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Match Filter
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'BOOYAH' | 'KILL' | 'FULL'>('ALL');

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [metricsRes, matchesRes, withRes] = await Promise.all([
        fetchMetrics(),
        fetchMatches(),
        fetchWithdrawals()
      ]);
      if (metricsRes.success) setMetrics(metricsRes.metrics);
      if (matchesRes.success) setMatches(matchesRes.matches || []);
      if (withRes.success) setWithdrawals(withRes.withdrawals || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Instant real-time socket/SSE sync
    const unsubscribe = subscribeToRealtimeEvents(() => {
      loadData(true);
    });

    // Fallback polling every 5 seconds for resilience
    const timer = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenRoster = async (match: any) => {
    setInspectMatch(match);
    setLoadingInspect(true);
    try {
      const res = await fetchMatchParticipants(match.id);
      if (res.success && res.participants) {
        setInspectParticipants(res.participants);
      } else {
        setInspectParticipants([]);
      }
    } catch {
      setInspectParticipants([]);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      const res = await updateMatch(matchId, { status: 'LIVE' });
      if (res.success) {
        loadData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await broadcastNotification({
        title: 'Platform Announcement',
        message: broadcastText.trim(),
        type: 'HIGH'
      });
      if (res.success) {
        alert('Broadcast sent! Notification pushed to all active players.');
        setBroadcastText('');
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-500">Loading Dashboard Operations...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Players', 
      value: metrics?.totalUsers || 8, 
      sub: 'Active Competitors',
      icon: Users, 
      color: 'text-blue-600', 
      border: 'border-blue-100',
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Scheduled Matches', 
      value: metrics?.totalMatches || 20, 
      sub: 'Battle Royale & Clash',
      icon: Gamepad2, 
      color: 'text-indigo-600', 
      border: 'border-indigo-100',
      bg: 'bg-indigo-50' 
    },
    { 
      label: 'Slot Registrations', 
      value: metrics?.totalRegistrations || 17, 
      sub: 'Paid Player Slots',
      icon: Trophy, 
      color: 'text-amber-600', 
      border: 'border-amber-100',
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Prizes Disbursed', 
      value: `₹${(metrics?.totalPrizeDistributed || 4750).toLocaleString()}`, 
      sub: 'Credited to Wallets',
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      border: 'border-emerald-100',
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Platform Deposits', 
      value: `₹${(metrics?.totalDeposits || 9500).toLocaleString()}`, 
      sub: 'Entry Fee Volume',
      icon: ArrowUpRight, 
      color: 'text-teal-600', 
      border: 'border-teal-100',
      bg: 'bg-teal-50' 
    },
    { 
      label: 'Pending Cashouts', 
      value: metrics?.pendingWithdrawals || withdrawals.filter(w => w.status === 'PENDING').length || 0, 
      sub: 'Action Required',
      icon: Wallet, 
      color: 'text-rose-600', 
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      highlight: (metrics?.pendingWithdrawals || withdrawals.filter(w => w.status === 'PENDING').length || 0) > 0
    },
  ];

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');

  const filteredUpcomingMatches = upcomingMatches.filter(m => {
    if (matchFilter === 'BOOYAH') return m.matchType === 'BOOYAH';
    if (matchFilter === 'KILL') return m.matchType === 'KILL';
    if (matchFilter === 'FULL') return (m.registeredCount || 0) >= (m.maxSlots || 48);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Dashboard in Clean Light Palette */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                MASTER DIRECTOR DASHBOARD
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Real-Time Sync Active (5s)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Free Fire Esports Tournament Dashboard
            </h2>
            <p className="text-xs md:text-sm text-blue-100 max-w-xl leading-relaxed">
              Real-time slot tracking, auto-scheduled match start transitions, custom room ID releases, and manual kill/Booyah payouts.
            </p>
          </div>

          {/* Quick Action Buttons with vivid colors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab && onNavigateTab('matches')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-sm hover:bg-blue-50 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Deploy Match</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('results')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-amber-950 font-extrabold text-xs shadow-sm hover:bg-amber-300 transition active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-900" />
              <span>Score & Payouts</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('withdrawals')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
            >
              <Wallet className="w-4 h-4 text-white" />
              <span>Cashouts ({pendingWithdrawals.length})</span>
            </button>

            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-xl bg-blue-900/50 border border-white/20 text-white hover:bg-blue-900/80 transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Core Platform Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            Live Platform Metrics
          </h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Real-Time Polling
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className={`bg-white rounded-2xl p-4 border ${card.border} shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between ${
                  card.highlight ? 'ring-1 ring-rose-400/50 bg-rose-50/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">{card.label}</span>
                  <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{card.value}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Running Live Matches Section (Prominently featured) */}
      {liveMatches.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Currently Running Live Matches ({liveMatches.length})
              </h4>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
              Promoted by Start Time
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.map(m => (
              <div key={m.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                      {m.mode} • {m.map} • {m.matchType}
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">{m.title}</h5>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Entry: ₹{m.entryFee} • Pool: <strong className="text-emerald-700">₹{m.prizePool}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenRoster(m)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{m.registeredCount || 0}/{m.maxSlots} Players</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab && onNavigateTab('results')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-xs transition"
                  >
                    Enter Scores & Disburse
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Operations: Upcoming Matches with Real-Time 48-Slot Tracker + Live App News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Upcoming Matches & Slot Fill Radar */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Scheduled Tournaments & 48-Slot Fill Radar</h4>
                <p className="text-xs text-slate-500">Live participant tracking as players join from mobile app</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'BOOYAH', label: '🏆 Booyah' },
                { id: 'KILL', label: '⚔️ Kill Rush' },
                { id: 'FULL', label: '🔥 Full (48/48)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMatchFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    matchFilter === f.id
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredUpcomingMatches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No scheduled tournaments match the selected filter.
              </div>
            ) : (
              filteredUpcomingMatches.slice(0, 6).map((m) => {
                const maxSlots = m.maxSlots || 48;
                const filled = m.registeredCount || 0;
                const fillPct = Math.min(100, Math.round((filled / maxSlots) * 100));
                const isFull = filled >= maxSlots;

              return (
                <div key={m.id} className="py-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                        <img 
                          src={m.bannerUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as any).src = '/shared-assets/bermuda.jpg'; }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{m.title}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isFull ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {isFull ? 'FULL (48/48)' : m.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {m.mode} • {m.map} • Start: <strong className="text-slate-800">{m.matchDate} at {m.matchTime}</strong> • Fee: ₹{m.entryFee}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenRoster(m)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1.5"
                        title="Inspect 48-slot roster"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect Roster</span>
                      </button>

                      <button
                        onClick={() => handleStartMatch(m.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition flex items-center gap-1"
                        title="Force start match now"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700" />
                        <span>Go Live</span>
                      </button>
                    </div>
                  </div>

                  {/* 48-Slot Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600" />
                        <span>{filled} of {maxSlots} Slots Filled</span>
                      </span>
                      <span className={`font-mono ${isFull ? 'text-emerald-700 font-extrabold' : 'text-blue-700'}`}>
                        {fillPct}% Capacity
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
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
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Column: App News / Push Announcement + Pending UPI Cashouts */}
        <div className="space-y-6">
          {/* App News & Push Ticker Desk */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">App News & Live Broadcast</h4>
                  <p className="text-xs text-slate-500">Push instant alerts to player devices</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Push Announcement / Ticker News</label>
                <textarea
                  rows={2}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. Grand Tournament Match 3 room ID releasing in 10 mins! Get ready."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={sendingBroadcast || !broadcastText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingBroadcast ? 'Broadcasting...' : 'Broadcast to All Players'}</span>
              </button>
            </form>
          </div>

          {/* Pending UPI Cashouts Quick Queue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">UPI Cashouts Desk</h4>
                  <p className="text-xs text-slate-500">Player settlement requests</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab && onNavigateTab('withdrawals')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All withdrawal requests are settled! No pending queues.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingWithdrawals.slice(0, 3).map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">{w.userName || w.userId}</span>
                      <span className="font-mono text-[11px] text-slate-500">{w.upiId}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-700 text-sm block">₹{w.amount}</span>
                      <button
                        onClick={() => onNavigateTab && onNavigateTab('withdrawals')}
                        className="text-[11px] text-blue-700 font-bold hover:underline"
                      >
                        Settle →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INSPECT 48-SLOT ROSTER MODAL DIRECTLY ON DASHBOARD */}
      {inspectMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <Users className="w-4 h-4" />
                  </span>
                  Live 48-Slot Match Roster
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-blue-700">{inspectMatch.title}</strong> • {inspectMatch.mode} ({inspectParticipants.length} of {inspectMatch.maxSlots || 48} Enrolled)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInspectMatch(null);
                    onNavigateTab && onNavigateTab('results');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs transition"
                >
                  Enter Match Scores
                </button>
                <button
                  onClick={() => setInspectMatch(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingInspect ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Fetching enrolled player roster...
              </div>
            ) : inspectParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No players have joined this match slot yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {inspectParticipants.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200">
                        #{p.slotNumber || idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ₹{p.walletBalance || 0} Balance
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-slate-900 truncate">{p.ign || p.userName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{p.userName}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 text-xs">
                      <span className="font-mono text-amber-800 font-bold text-[11px]">{p.ffUid}</span>
                      <button
                        onClick={() => copyToClipboard(p.ffUid, `dash_uid_${idx}`)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Copy UID"
                      >
                        {copiedKey === `dash_uid_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {inspectParticipants.length} active slots enrolled
              </span>
              <button
                type="button"
                onClick={() => setInspectMatch(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

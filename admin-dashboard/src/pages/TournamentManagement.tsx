import React, { useEffect, useState } from 'react';
import { Award, Bell, CheckCircle, Trophy, Users, Shield, Plus, Calendar, Flame, Zap, Trash2, Edit3, Send, RefreshCw, X } from 'lucide-react';
import { fetchTournaments, createTournament, updateTournament, deleteTournament, broadcastTournament } from '../api';

export const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTourney, setEditingTourney] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    prizePool: 25000,
    status: 'REGISTRATION_OPEN',
    bannerUrl: '/shared-assets/ff_play_compete_win.jpg',
    description: 'Championship battle for top Free Fire esports squads.'
  });

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const res = await fetchTournaments();
      if (res.success && res.tournaments) {
        setTournaments(res.tournaments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleOpenCreate = () => {
    setEditingTourney(null);
    setFormData({
      title: '',
      subtitle: 'SEASON FINALE 2026',
      prizePool: 50000,
      status: 'REGISTRATION_OPEN',
      bannerUrl: '/shared-assets/ff_play_compete_win.jpg',
      description: 'The premier championship tournament for competitive Free Fire players.'
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTourney(t);
    setFormData({
      title: t.title,
      subtitle: t.subtitle,
      prizePool: t.prizePool,
      status: t.status,
      bannerUrl: t.bannerUrl,
      description: t.description
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Tournament title is required');
      return;
    }

    try {
      if (editingTourney) {
        const res = await updateTournament(editingTourney.id, formData);
        if (res.success) {
          setShowCreateModal(false);
          loadTournaments();
        } else {
          alert('Error: ' + res.message);
        }
      } else {
        const res = await createTournament(formData);
        if (res.success) {
          setShowCreateModal(false);
          loadTournaments();
        } else {
          alert('Error: ' + res.message);
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      const res = await deleteTournament(id);
      if (res.success) {
        loadTournaments();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleBroadcast = async (id: string) => {
    try {
      const res = await broadcastTournament(id);
      if (res.success) {
        alert(res.message);
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'ONGOING': return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      default: return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Award className="w-5 h-5" />
            </span>
            Grand Championship Tournaments
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create high-stakes multi-stage championship series, track player registrations, and broadcast live alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
          <button
            onClick={loadTournaments}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(t => (
          <div key={t.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              {/* Banner */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img 
                  src={t.bannerUrl} 
                  alt={t.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = '/shared-assets/bermuda.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border backdrop-blur-md ${getStatusBadge(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-white shadow-md">
                    ₹{Number(t.prizePool).toLocaleString()} Prize
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-black text-amber-600 tracking-wider uppercase block">{t.subtitle}</span>
                  <h4 className="font-black text-slate-900 text-base mt-0.5">{t.title}</h4>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                  {t.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.notifiedUserIds?.length || 0} Subscribed Players</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {t.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleBroadcast(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition shadow-sm"
                title="Send notification to all players"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Alert</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                  title="Edit tournament"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                  title="Delete tournament"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <Award className="w-5 h-5" />
                </span>
                {editingTourney ? 'Edit Grand Tournament' : 'Create Grand Tournament'}
              </h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tournament Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="e.g. FREE FIRE GRAND INVITATIONAL 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Season Tag</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-amber-500 outline-none"
                    placeholder="e.g. SEASON FINALE 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Prize Pool (₹)</label>
                  <input
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-black text-amber-700 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold outline-none focus:bg-white"
                  >
                    <option value="COMING_SOON">COMING SOON</option>
                    <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner Preset</label>
                  <select
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium outline-none focus:bg-white"
                  >
                    <option value="/shared-assets/banner_big_tournament.jpg">Big Tournament Coming Soon</option>
                    <option value="/shared-assets/banner_battle_royale.jpg">Battle Royale Banner</option>
                    <option value="/shared-assets/banner_clash_squad.jpg">Clash Squad Banner</option>
                    <option value="/shared-assets/banner_1v1_duels.jpg">1v1 Duels Banner</option>
                    <option value="/shared-assets/banner_fair_play.jpg">Fair Play Only Banner</option>
                    <option value="/shared-assets/ff_play_compete_win.jpg">Grand Championship Banner</option>
                    <option value="/shared-assets/bermuda.jpg">Bermuda Arena</option>
                    <option value="/shared-assets/purgatory.jpg">Purgatory War</option>
                    <option value="/shared-assets/kalahari.jpg">Kalahari Desert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Tournament Rules</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-normal focus:bg-white focus:border-amber-500 outline-none"
                  placeholder="Format, stages, rules, and qualification details..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-500/20 active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  <span>{editingTourney ? 'Update Tournament' : 'Publish Tournament'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  Headphones, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Check, 
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { fetchSupportTickets, replySupportTicket } from '../api';

export const SupportDesk: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Reply Modal State
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchSupportTickets();
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = (ticket: any) => {
    setActiveTicket(ticket);
    setAdminReplyText(ticket.adminReply || '');
    setReplyStatus(ticket.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    if (!adminReplyText.trim()) {
      alert('Please enter a response message for the player.');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await replySupportTicket(activeTicket.id, adminReplyText, replyStatus);
      if (res.success) {
        setActiveTicket(null);
        loadTickets();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.message && t.message.toLowerCase().includes(q)) ||
      (t.userName && t.userName.toLowerCase().includes(q)) ||
      (t.userIgn && t.userIgn.toLowerCase().includes(q)) ||
      (t.userId && t.userId.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Headphones className="w-5 h-5 text-rose-600" />
            </span>
            Player Support & Helpdesk Desk
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Resolve player issues regarding room passwords, tournament scores, deposits, and account inquiries.
          </p>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* KPI Cards in Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unresolved / Open</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{openCount}</p>
            <span className="text-[11px] text-slate-400 font-medium">Awaiting administrator response</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</p>
            <span className="text-[11px] text-slate-400 font-medium">Under active review</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resolved Tickets</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
            <span className="text-[11px] text-slate-400 font-medium">Player notified successfully</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets, IGN, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  statusFilter === st ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="MATCH_ISSUE">Match Issue</option>
            <option value="WALLET">Wallet & UPI</option>
            <option value="ACCOUNT">Account</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Ticket List in Light Theme */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-base">No support tickets found</h4>
            <p className="text-xs text-slate-400 mt-1">There are no pending tickets matching your filters.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-5 shadow-2xs transition space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    ticket.status === 'OPEN' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : ticket.status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {ticket.status}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {ticket.id}
                  </span>

                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {ticket.category}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Ticket Details & User Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{ticket.subject}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {ticket.message}
                  </p>

                  {ticket.adminReply && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-900 mt-2">
                      <span className="font-bold text-emerald-800 block mb-0.5">Admin Response Dispatched:</span>
                      {ticket.adminReply}
                    </div>
                  )}
                </div>

                {/* Player Profile Box */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Player Contact</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{ticket.userName} ({ticket.userIgn})</span>
                  </div>
                  {ticket.userPhone && (
                    <div className="text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ticket.userPhone}</span>
                    </div>
                  )}
                  {ticket.userEmail && (
                    <div className="text-slate-500 text-[11px] flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ticket.userEmail}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenReply(ticket)}
                    className="w-full mt-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{ticket.adminReply ? 'Update Resolution' : 'Reply & Resolve'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal in Light Theme */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                Reply to Ticket {activeTicket.id}
              </h4>
              <button 
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-900 mb-0.5">Subject: {activeTicket.subject}</p>
              <p className="text-slate-600 line-clamp-3">{activeTicket.message}</p>
            </div>

            <form onSubmit={handleSubmitReply} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold outline-none"
                >
                  <option value="RESOLVED">RESOLVED (Issue Fixed / Player Satisfied)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Under Investigation)</option>
                  <option value="OPEN">OPEN (Keep Pending)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Response Message</label>
                <textarea
                  rows={4}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:border-rose-600 outline-none"
                  placeholder="Explain resolution to the player. They will receive an instant in-app notification."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Dispatching...' : 'Dispatch Reply & Notify'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

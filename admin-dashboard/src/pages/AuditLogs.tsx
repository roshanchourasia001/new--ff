import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, Search, RefreshCw, Eye, Copy, CheckCheck, X } from 'lucide-react';
import { fetchAuditLogs } from '../api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchAuditLogs().then(res => {
      if (res.success) setLogs(res.auditLogs || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(q)) ||
      (log.targetType && log.targetType.toLowerCase().includes(q)) ||
      (log.targetId && log.targetId.toLowerCase().includes(q)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETED') || action.includes('CANCEL') || action.includes('BAN')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('CREDIT') || action.includes('APPROVE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('ROOM') || action.includes('ADJUST')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            Security & Financial Audit Trail
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Immutable administrative ledger tracking match creations, room updates, wallet modifications, and payout disbursements.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search action event, target ID, admin user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold self-start sm:self-auto">
          Displaying <strong className="text-slate-900 font-black">{filteredLogs.length}</strong> of {logs.length} Recorded Events
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Action Event</th>
                <th className="py-4 px-5">Performed By</th>
                <th className="py-4 px-5">Target Entity</th>
                <th className="py-4 px-5">Audit Payload Details</th>
                <th className="py-4 px-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                    {loading ? 'Retrieving audit logs...' : 'No audit records match your query.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition text-xs group">
                    <td className="py-4 px-5 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 whitespace-nowrap">
                      {log.performedBy}
                    </td>
                    <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold">{log.targetType}</span> / <span className="font-mono font-bold text-blue-700">{log.targetId}</span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition"
                        title="View Full Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Database className="w-5 h-5" />
                </span>
                <h4 className="text-base font-black text-slate-900">Audit Event Details</h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-bold block">Event Type:</span>
                <div className="font-mono font-bold text-blue-700 mt-0.5">{selectedLog.action}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Actor:</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedLog.performedBy}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Target:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedLog.targetType} ({selectedLog.targetId})</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Timestamp:</span>
                <div className="text-slate-700 mt-0.5 font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Payload State & Diffs</span>
                <button
                  onClick={() => handleCopyPayload(selectedLog.details)}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  {copiedPayload ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-slate-800 shadow-inner">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
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

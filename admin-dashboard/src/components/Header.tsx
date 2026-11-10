import React from 'react';
import { Shield, Menu, RefreshCw, Zap, ExternalLink } from 'lucide-react';

interface HeaderProps {
  title: string;
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onToggleSidebar,
  onRefresh,
  isRefreshing = false 
}) => {
  return (
    <header className="h-16 bg-white/95 border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Tournament Operations & Financial Control Suite</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 md:gap-3">
        <a
          href="/app"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 text-xs font-bold transition"
          title="Open player mobile web view"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          <span>Player App</span>
        </a>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-50"
            title="Refresh Realtime Platform Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">SuperAdmin</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-blue-500/20">
            AD
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-900">Director Root</div>
            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Full Access</div>
          </div>
        </div>
      </div>
    </header>
  );
};

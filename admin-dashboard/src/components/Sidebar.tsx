import React from 'react';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Trophy, 
  Wallet, 
  Users, 
  Award, 
  ShieldCheck, 
  ExternalLink,
  Flame,
  X,
  Sliders,
  Headphones,
  ReceiptText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingWithdrawalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose,
  pendingWithdrawalsCount = 0
}) => {
  const menuItems = [
    { 
      id: 'overview', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      iconColor: 'text-blue-600',
      activeBg: 'bg-blue-50 text-blue-700 border-blue-600'
    },
    { 
      id: 'matches', 
      label: 'Match Operations', 
      icon: Gamepad2, 
      badge: 'Live',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-50 text-indigo-700 border-indigo-600'
    },
    { 
      id: 'results', 
      label: 'Manual Score & Payouts', 
      icon: Trophy,
      badge: 'Manual Kill/Rank',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      iconColor: 'text-amber-500',
      activeBg: 'bg-amber-50 text-amber-800 border-amber-500'
    },
    { 
      id: 'withdrawals', 
      label: 'UPI Cashouts', 
      icon: Wallet, 
      count: pendingWithdrawalsCount,
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-50 text-emerald-700 border-emerald-600'
    },
    { 
      id: 'users', 
      label: 'Player Directory & Wallets', 
      icon: Users,
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-50 text-purple-700 border-purple-600'
    },
    { 
      id: 'tournaments', 
      label: 'Grand Tournaments', 
      icon: Award,
      iconColor: 'text-orange-500',
      activeBg: 'bg-orange-50 text-orange-700 border-orange-500'
    },
    { 
      id: 'ledger', 
      label: 'Financial Ledger', 
      icon: ReceiptText,
      iconColor: 'text-teal-600',
      activeBg: 'bg-teal-50 text-teal-700 border-teal-600'
    },
    { 
      id: 'support', 
      label: 'Helpdesk Tickets', 
      icon: Headphones,
      iconColor: 'text-rose-500',
      activeBg: 'bg-rose-50 text-rose-700 border-rose-500'
    },
    { 
      id: 'settings', 
      label: 'App Master Control', 
      icon: Sliders,
      iconColor: 'text-slate-700',
      activeBg: 'bg-slate-100 text-slate-800 border-slate-700'
    },
    { 
      id: 'audit', 
      label: 'Security & Audit', 
      icon: ShieldCheck,
      iconColor: 'text-blue-500',
      activeBg: 'bg-blue-50 text-blue-700 border-blue-600'
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`w-72 bg-white border-r border-slate-200/90 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-sm transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Flame className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-900 text-base tracking-tight">FF ESPORTS</h1>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-200">
                  ROOT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Tournament Director Suite</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time server status pill */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-900">Backend Server</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
              :5000 LIVE
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? `${item.activeBg} font-extrabold shadow-xs border-l-4`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-white shadow-2xs' : ''}`}>
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.iconColor}`} />
                  </div>
                  <span className="tracking-tight text-sm font-bold">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Quick Links */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2">
          <a
            href="/app"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/90 transition shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              Open Player Android App
            </span>
            <span className="text-[10px] font-mono text-slate-500">/app</span>
          </a>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5 font-mono">
            <span>Key: <code className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">admin123</code></span>
            <span className="text-slate-400">v3.0 Light</span>
          </div>
        </div>
      </aside>
    </>
  );
};

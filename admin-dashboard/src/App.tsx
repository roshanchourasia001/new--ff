import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './pages/DashboardOverview';
import { MatchManagement } from './pages/MatchManagement';
import { ResultManagement } from './pages/ResultManagement';
import { WithdrawalManagement } from './pages/WithdrawalManagement';
import { UserManagement } from './pages/UserManagement';
import { TournamentManagement } from './pages/TournamentManagement';
import { TransactionLedger } from './pages/TransactionLedger';
import { SupportDesk } from './pages/SupportDesk';
import { AppControl } from './pages/AppControl';
import { AuditLogs } from './pages/AuditLogs';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Executive Tournament Dashboard & Real-Time Operations';
      case 'matches': return 'Tournament Match Manager & Slot Controller';
      case 'results': return 'Score Verification & Instant Prize Payouts';
      case 'withdrawals': return 'UPI Withdrawal Requests & Settlement';
      case 'users': return 'Player Accounts & Direct Wallet Control';
      case 'tournaments': return 'Grand Championship Series & Brackets';
      case 'ledger': return 'Platform Financial Ledger & Mass Bonus Engine';
      case 'support': return 'Player Support Desk & Helpdesk Tickets';
      case 'settings': return 'Global App Master Control, Gateway & Maintenance';
      case 'audit': return 'Security & Financial Audit Trail';
      default: return 'Admin Console';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col md:flex-row font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen w-full">
        <Header 
          title={getTitle()} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {activeTab === 'overview' && <DashboardOverview onNavigateTab={setActiveTab} />}
          {activeTab === 'matches' && <MatchManagement />}
          {activeTab === 'results' && <ResultManagement />}
          {activeTab === 'withdrawals' && <WithdrawalManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'tournaments' && <TournamentManagement />}
          {activeTab === 'ledger' && <TransactionLedger />}
          {activeTab === 'support' && <SupportDesk />}
          {activeTab === 'settings' && <AppControl />}
          {activeTab === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Sliders, 
  ShieldAlert, 
  AlertTriangle, 
  Bell, 
  Smartphone, 
  Send, 
  DollarSign, 
  Download, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Headphones, 
  Radio, 
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { fetchAppSettings, updateAppSettings, broadcastNotification, fetchSystemDiagnostics, getBackupDownloadUrl } from '../api';

export const AppControl: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    maintenanceMode: false,
    maintenanceMessage: 'Server is undergoing scheduled maintenance. Matches will resume shortly!',
    minWithdrawal: 50,
    maxWithdrawal: 10000,
    tdsPercentage: 0,
    minDeposit: 10,
    maxDeposit: 50000,
    adminUpiId: '8949267586@upi',
    merchantName: 'FF ESPORTS TOURNAMENTS',
    supportWhatsApp: '+918949267586',
    supportPhone: '+918949267586',
    supportEmail: 'support@ffesports.in',
    bannerTitle: 'PLAY. COMPETE. WIN.',
    bannerSubtitle: 'REGISTER NOW AND SHOW YOUR SKILLS!',
    bannerCta: 'Join Tournaments',
    announcementTicker: '🔥 Season 4 Clash Squad & Bermuda Solo tournaments are now LIVE! Register and claim your cash rewards!',
    appVersion: '1.0.4',
    minAppVersion: '1.0.0',
    apkDownloadUrl: 'http://localhost:5000/app/FreeFire-Esports-release.apk',
    forceUpdate: false,
    allowedLanguages: ['en', 'hi', 'bn']
  });

  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Broadcast Notification State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '⚡ Weekend Flash Cup Announced!',
    message: 'Join today at 8:00 PM for Bermuda Solo. ₹500 prize pool up for grabs!',
    type: 'ANNOUNCEMENT',
    userId: 'ALL'
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetchAppSettings(),
        fetchSystemDiagnostics()
      ]);
      if (sRes.success && sRes.settings) {
        setSettings((prev: any) => ({ ...prev, ...sRes.settings }));
      }
      if (dRes.success && dRes.diagnostics) {
        setDiagnostics(dRes.diagnostics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateAppSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Error saving settings: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      alert('Title and message are required.');
      return;
    }
    setBroadcasting(true);
    try {
      const res = await broadcastNotification(broadcastForm);
      if (res.success) {
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 3000);
        setBroadcastForm({
          title: '',
          message: '',
          type: 'ANNOUNCEMENT',
          userId: 'ALL'
        });
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading App Master Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <Sliders className="w-5 h-5 text-slate-800" />
            </span>
            Global App Control & Master Settings
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Full end-to-end command over mobile app status, payment gateways, maintenance toggles, and push broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getBackupDownloadUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Full JSON DB</span>
          </a>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Maintenance Mode Emergency Alert Banner in Light Theme */}
      <div className={`p-5 rounded-3xl border transition-all ${
        settings.maintenanceMode 
          ? 'bg-rose-50 border-rose-300 text-rose-900' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              settings.maintenanceMode ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900">
                  App Service Status: {settings.maintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'LIVE & OPERATIONAL'}
                </h4>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  settings.maintenanceMode 
                    ? 'bg-rose-200 text-rose-900 border-rose-300' 
                    : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                }`}>
                  {settings.maintenanceMode ? 'LOCKED FOR PLAYERS' : 'PLAYERS ONLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {settings.maintenanceMode 
                  ? 'The mobile application is displaying the maintenance banner. Match entry and withdrawals are paused.'
                  : 'All player services, Google logins, match registrations, and UPI payouts are operating normally.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition shadow-sm ${
              settings.maintenanceMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
            }`}
          >
            {settings.maintenanceMode ? 'Turn App Back Online' : 'Enable Maintenance Lock'}
          </button>
        </div>
      </div>

      {/* Main Settings Form in Light Theme */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: App Announcements & Banner Content */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Radio className="w-5 h-5 text-amber-500" />
              <h4 className="font-extrabold text-slate-900 text-sm">App Announcements & Banner Content</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Top Announcement Marquee Ticker</label>
                <input
                  type="text"
                  value={settings.announcementTicker || ''}
                  onChange={(e) => handleSettingChange('announcementTicker', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                  placeholder="Text ticker running at top of app home screen"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Notice Screen Text</label>
                <textarea
                  rows={2}
                  value={settings.maintenanceMessage || ''}
                  onChange={(e) => handleSettingChange('maintenanceMessage', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Hero Title</label>
                  <input
                    type="text"
                    value={settings.bannerTitle || ''}
                    onChange={(e) => handleSettingChange('bannerTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Hero Subtitle</label>
                  <input
                    type="text"
                    value={settings.bannerSubtitle || ''}
                    onChange={(e) => handleSettingChange('bannerSubtitle', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: UPI Gateway & Wallet Rules */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">UPI Gateway & Wallet Rules</h4>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Receiving UPI VPA</label>
                  <input
                    type="text"
                    value={settings.adminUpiId || ''}
                    onChange={(e) => handleSettingChange('adminUpiId', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merchant Display Name</label>
                  <input
                    type="text"
                    value={settings.merchantName || ''}
                    onChange={(e) => handleSettingChange('merchantName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Cashout (₹)</label>
                  <input
                    type="number"
                    value={settings.minWithdrawal || 50}
                    onChange={(e) => handleSettingChange('minWithdrawal', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Cashout / Day (₹)</label>
                  <input
                    type="number"
                    value={settings.maxWithdrawal || 10000}
                    onChange={(e) => handleSettingChange('maxWithdrawal', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Deposit Allowed (₹)</label>
                  <input
                    type="number"
                    value={settings.minDeposit || 10}
                    onChange={(e) => handleSettingChange('minDeposit', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TDS / Platform Fee (%)</label>
                  <input
                    type="number"
                    value={settings.tdsPercentage || 0}
                    onChange={(e) => handleSettingChange('tdsPercentage', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: App Versioning & OTA Updates */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">App Versioning & APK Release</h4>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current App Release</label>
                  <input
                    type="text"
                    value={settings.appVersion || '1.0.4'}
                    onChange={(e) => handleSettingChange('appVersion', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Supported Version</label>
                  <input
                    type="text"
                    value={settings.minAppVersion || '1.0.0'}
                    onChange={(e) => handleSettingChange('minAppVersion', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">APK Direct Download Link</label>
                <input
                  type="text"
                  value={settings.apkDownloadUrl || ''}
                  onChange={(e) => handleSettingChange('apkDownloadUrl', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Enforce Mandatory APK Update</span>
                  <span className="text-slate-500">Blocks outdated APK players until updated</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.forceUpdate || false}
                  onChange={(e) => handleSettingChange('forceUpdate', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Official Helpdesk Lines */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Headphones className="w-5 h-5 text-rose-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">Official Helpdesk & Support Lines</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Direct Support</label>
                <input
                  type="text"
                  value={settings.supportWhatsApp || ''}
                  onChange={(e) => handleSettingChange('supportWhatsApp', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Helpline Phone Number</label>
                <input
                  type="text"
                  value={settings.supportPhone || ''}
                  onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Email Address</label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div>
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <Check className="w-4 h-4" /> All settings synchronized & published to live app!
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                Changes take effect across Android mobile clients immediately upon saving.
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </form>

      {/* Broadcast Notification Section in Light Theme */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <Bell className="w-5 h-5 text-amber-500" />
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">Instant Push Broadcast Engine</h4>
            <p className="text-xs text-slate-500">Broadcast urgent notifications or match invitations directly into all players' inboxes.</p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Notification Title</label>
              <input
                type="text"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={broadcastForm.userId}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, userId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold outline-none"
              >
                <option value="ALL">All Registered Players</option>
                <option value="user_roshan">Roshan Chourasia (VIP)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notification Message</label>
            <textarea
              rows={2}
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:border-blue-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {broadcastSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Check className="w-4 h-4" /> Push broadcast delivered to player inboxes!
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={broadcasting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcasting ? 'Transmitting...' : 'Send In-App Broadcast'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Health Diagnostics Card in Light Theme */}
      {diagnostics && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">System Diagnostics & Database Records</h4>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              HEALTHY • {diagnostics.nodeVersion}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Players</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.users || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Matches</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.matches || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Registrations</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.registrations || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Transactions</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.transactions || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Cashouts</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.withdrawals || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Tournaments</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.tournaments || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Tickets</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.counts?.tickets || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">RAM (RSS)</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{diagnostics.memoryRssMb} MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

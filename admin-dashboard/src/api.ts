const API_BASE = (typeof window !== 'undefined' && window.location.origin.includes(':5173'))
  ? 'http://localhost:5000/api'
  : (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');

export function getAdminKey(): string {
  if (typeof window === 'undefined') return 'admin123';
  return localStorage.getItem('ff_admin_key') || 'admin123';
}

export function setAdminKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ff_admin_key', key);
  }
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': getAdminKey()
  };
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, { headers: authHeaders() });
  return res.json();
}

export async function fetchMatches(filters: any = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/matches?${params.toString()}`);
  return res.json();
}

export async function createMatch(matchData: any) {
  const res = await fetch(`${API_BASE}/admin/matches`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(matchData)
  });
  return res.json();
}

export async function updateMatch(id: string, matchData: any) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(matchData)
  });
  return res.json();
}

export async function deleteMatch(id: string) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

export async function fetchMatchParticipants(id: string) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}/participants`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function setRoomCredentials(id: string, roomId: string, roomPassword: string) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}/room`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ roomId, roomPassword })
  });
  return res.json();
}

export async function distributeBooyahResults(id: string, rankings: any[]) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}/results/booyah`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rankings })
  });
  return res.json();
}

export async function distributeKillResults(id: string, killRecords: any[]) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}/results/kill`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ killRecords })
  });
  return res.json();
}

export async function submitMatchResults(id: string, playerResults: any[]) {
  const res = await fetch(`${API_BASE}/admin/matches/${id}/results/submit-all`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ playerResults })
  });
  return res.json();
}

export async function fetchWithdrawals() {
  const res = await fetch(`${API_BASE}/admin/withdrawals`, { headers: authHeaders() });
  return res.json();
}

export async function handleWithdrawal(id: string, approve: boolean, payoutTxnId?: string, reason?: string) {
  const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/action`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ approve, payoutTxnId, reason })
  });
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
  return res.json();
}

export async function toggleUserBan(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/ban`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
}

export async function updateUser(id: string, data: any) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function adjustUserWallet(id: string, amount: number, type: 'CREDIT' | 'DEBIT', reason: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/wallet-adjust`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount, type, reason })
  });
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: authHeaders() });
  return res.json();
}

export async function addMatchParticipant(matchId: string, userId: string, deductFee: boolean = false) {
  const res = await fetch(`${API_BASE}/admin/matches/${matchId}/participants/add`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, deductFee })
  });
  return res.json();
}

export async function kickMatchParticipant(matchId: string, userId: string) {
  const res = await fetch(`${API_BASE}/admin/matches/${matchId}/participants/${userId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

export async function fetchUserDetails(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/details`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function fetchTransactions(filters: any = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/admin/transactions?${params.toString()}`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function massBonusCredit(amount: number, reason: string) {
  const res = await fetch(`${API_BASE}/admin/wallet/mass-bonus`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount, reason })
  });
  return res.json();
}

export async function fetchTournaments() {
  const res = await fetch(`${API_BASE}/admin/tournaments`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function createTournament(data: any) {
  const res = await fetch(`${API_BASE}/admin/tournaments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateTournament(id: string, data: any) {
  const res = await fetch(`${API_BASE}/admin/tournaments/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteTournament(id: string) {
  const res = await fetch(`${API_BASE}/admin/tournaments/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

export async function broadcastTournament(id: string) {
  const res = await fetch(`${API_BASE}/admin/tournaments/${id}/broadcast`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
}

export async function fetchSupportTickets() {
  const res = await fetch(`${API_BASE}/admin/support/tickets`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function replySupportTicket(id: string, adminReply: string, status: string) {
  const res = await fetch(`${API_BASE}/admin/support/tickets/${id}/reply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ adminReply, status })
  });
  return res.json();
}

export async function fetchAppSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function updateAppSettings(settings: any) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(settings)
  });
  return res.json();
}

export async function broadcastNotification(data: { title: string; message: string; type?: string; userId?: string }) {
  const res = await fetch(`${API_BASE}/admin/broadcast-notification`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchSystemDiagnostics() {
  const res = await fetch(`${API_BASE}/admin/system/diagnostics`, {
    headers: authHeaders()
  });
  return res.json();
}

export function getBackupDownloadUrl(): string {
  return `${API_BASE}/admin/system/backup`;
}

export function subscribeToRealtimeEvents(onEvent: (data: { type: string; payload: any }) => void): () => void {
  const streamUrl = `${API_BASE}/realtime/stream`;
  try {
    const es = new EventSource(streamUrl);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type && parsed.type !== 'CONNECTED') {
          onEvent(parsed);
        }
      } catch (e) {}
    };
    return () => es.close();
  } catch {
    return () => {};
  }
}

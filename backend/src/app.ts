import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { dbManager, db } from './storage/db';
import { MatchService } from './services/matchService';
import { WalletService } from './services/walletService';
import { ResultService } from './services/resultService';
import { runSeed } from './seed/seedData';
import { Match, Tournament, SupportTicket, AppNotification, MatchRegistration, WalletTransaction } from './types';
import { authGuard } from './auth';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Serve shared assets (map images, banners, SVGs)
app.use('/shared-assets', express.static(path.join(__dirname, '..', '..', 'shared-assets')));
app.use('/app', express.static(path.join(__dirname, '..', '..', 'apk-builder', 'assets')));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'admin-dashboard', 'dist', 'assets')));
app.use('/admin', express.static(path.join(__dirname, '..', '..', 'admin-dashboard', 'dist')));
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin-dashboard', 'dist', 'index.html'));
});
app.get('/admin/*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'admin-dashboard', 'dist', 'index.html'));
});
app.get('/', (req, res) => res.redirect('/admin'));

app.use('/api', authGuard());

// ----------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE) ENGINE
// ----------------------------------------------------
interface RealtimeClient {
  id: string;
  res: Response;
}
const realtimeClients: RealtimeClient[] = [];

export function broadcastRealtimeEvent(type: string, payload: any = {}) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (let i = realtimeClients.length - 1; i >= 0; i--) {
    try {
      realtimeClients[i].res.write(`data: ${data}\n\n`);
    } catch {
      realtimeClients.splice(i, 1);
    }
  }
}
(global as any).broadcastRealtimeEvent = broadcastRealtimeEvent;

const handleRealtimeStream = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = Math.random().toString(36).substring(7);
  const client: RealtimeClient = { id: clientId, res };
  realtimeClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, clientsCount: realtimeClients.length, timestamp: new Date().toISOString() })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = realtimeClients.findIndex(c => c.id === clientId);
    if (idx !== -1) realtimeClients.splice(idx, 1);
  });
};

app.get('/api/realtime/stream', handleRealtimeStream);
app.get('/api/events', handleRealtimeStream);

// Ensure initial seed
if (Object.keys(db.users).length === 0) {
  runSeed();
}

// Helper: Automatic unique Profile ID generation (e.g. PID-1001, PID-1002...)
export function getNextProfileId(): string {
  const existingNums = Object.values(db.users)
    .map(u => u.profileId)
    .filter(Boolean)
    .map(pid => parseInt(pid!.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
  return `PID-${max + 1}`;
}

// Helper: Automatic unique Match Code generation (e.g. M-101, M-102...)
export function getNextMatchCode(): string {
  const existingNums = Object.values(db.matches)
    .map(m => m.matchCode || m.id)
    .filter(Boolean)
    .map(code => parseInt(code!.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = existingNums.length > 0 ? Math.max(...existingNums) : 100;
  return `M-${max + 1}`;
}

// Backfill any missing Profile IDs or Match Codes
let autoPid = 1001;
Object.values(db.users).forEach(u => {
  if (!u.profileId) {
    u.profileId = `PID-${autoPid++}`;
  }
});

let autoMid = 101;
Object.values(db.matches).forEach(m => {
  if (!m.matchCode) {
    m.matchCode = `M-${autoMid++}`;
  }
});
dbManager.save();

// ----------------------------------------------------
// AUTH & PROFILE ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/google-login', (req: Request, res: Response) => {
  try {
    const identity = res.locals.identity;
    const userId = identity?.uid || req.body?.userId || ('usr_' + Date.now());
    let user = db.users[userId];
    if (!user) {
      const now = new Date().toISOString();
      const ign = req.body?.ign ? String(req.body.ign).trim() : (identity?.name || req.body?.name || 'Player');
      const ffUid = req.body?.ffUid ? String(req.body.ffUid).trim() : '';
      user = {
        id: userId,
        profileId: getNextProfileId(),
        name: identity?.name || req.body?.name || 'Player',
        ign: ign,
        ffUid: ffUid,
        email: identity?.email || req.body?.email || '',
        phone: req.body?.phone || '',
        age: req.body?.age !== undefined ? Number(req.body.age) : 18,
        gender: req.body?.gender || 'Male',
        state: req.body?.state || '',
        country: req.body?.country || 'India',
        avatarUrl: identity?.picture || req.body?.avatarUrl || 'images/avatar.jpg',
        isProfileComplete: Boolean(ffUid),
        isBanned: false,
        createdAt: now,
        updatedAt: now
      };
      db.users[userId] = user;
      WalletService.getOrCreateWallet(userId);
      dbManager.save();
    } else {
      if (identity?.picture && (!user.avatarUrl || user.avatarUrl.includes('avatar.jpg'))) {
        user.avatarUrl = identity.picture;
      }
      if (identity?.name && (user.name === 'Player' || !user.name)) {
        user.name = identity.name;
      }
      if (identity?.email && !user.email) {
        user.email = identity.email;
      }
      dbManager.save();
    }

    const wallet = WalletService.getOrCreateWallet(user.id);
    return res.json({
      success: true,
      user,
      wallet,
      isNewUser: !user.isProfileComplete
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users/profile/:userId', (req: Request, res: Response) => {
  const user = db.users[req.params.userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const wallet = WalletService.getOrCreateWallet(user.id);
  return res.json({ success: true, user, wallet });
});

app.put('/api/users/profile/:userId', (req: Request, res: Response) => {
  const user = db.users[req.params.userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { name, ign, ffUid, age, gender, state, country, phone, avatarUrl } = req.body;
  if (name !== undefined) user.name = name;
  if (ign !== undefined) user.ign = ign.trim();
  if (ffUid !== undefined) user.ffUid = ffUid.trim();
  if (age !== undefined) user.age = Number(age);
  if (gender !== undefined) user.gender = gender;
  if (state !== undefined) user.state = state;
  if (country !== undefined) user.country = country;
  if (phone !== undefined) user.phone = phone;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  user.isProfileComplete = Boolean(user.ffUid);
  user.updatedAt = new Date().toISOString();

  dbManager.save();
  return res.json({ success: true, user });
});

// ----------------------------------------------------
// MATCHES ENDPOINTS
// ----------------------------------------------------
app.get('/api/matches', (req: Request, res: Response) => {
  try {
    const { mode, map, matchType, search, status } = req.query;
    const matches = MatchService.getAllMatches({
      mode: mode as string,
      map: map as string,
      matchType: matchType as string,
      search: search as string,
      status: status as string
    });
    return res.json({ success: true, matches: matches.map(({ roomId, roomPassword, ...match }: any) => match) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/matches/:id', (req: Request, res: Response) => {
  const match = MatchService.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
  const { roomId, roomPassword, ...publicMatch } = match;
  return res.json({ success: true, match: publicMatch });
});

app.get('/api/matches/:id/slots', (req: Request, res: Response) => {
  const matchId = req.params.id;
  const match = db.matches[matchId];
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  const bookedSlots = Object.values(db.matchRegistrations)
    .filter(r => r.matchId === matchId && r.status === 'CONFIRMED')
    .map(r => ({
      slotNumber: r.slotNumber,
      ign: r.ign,
      userId: r.userId,
      teamMembersCount: (r.teammateUids ? r.teammateUids.length : 0) + 1
    }));

  return res.json({
    success: true,
    matchId,
    maxSlots: match.maxSlots,
    mode: match.mode,
    category: match.category,
    bookedSlots
  });
});

app.post('/api/matches/:id/register', (req: Request, res: Response) => {
  try {
    const { userId, teamMembers, teammateUids, selectedSlot } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const result = MatchService.registerUser(
      userId,
      req.params.id,
      teamMembers,
      teammateUids,
      selectedSlot ? parseInt(selectedSlot.toString(), 10) : undefined
    );
    const updatedWallet = WalletService.getOrCreateWallet(userId);

    broadcastRealtimeEvent('MATCH_REGISTRATION', {
      matchId: req.params.id,
      userId,
      match: result.match,
      registration: result.registration
    });

    return res.json({
      success: true,
      message: 'Match registration successful!',
      registration: result.registration,
      match: result.match,
      wallet: updatedWallet
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/matches/:id/room', (req: Request, res: Response) => {
  try {
    const userId = res.locals.identity.uid;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const roomData = MatchService.getRoomCredentials(req.params.id, userId);
    return res.json({ success: true, ...roomData });
  } catch (err: any) {
    return res.status(403).json({ success: false, message: err.message });
  }
});

app.get('/api/matches/my-matches/:userId', (req: Request, res: Response) => {
  try {
    const filter = req.query.status as any;
    const matches = MatchService.getMyMatches(req.params.userId, filter);
    return res.json({ success: true, matches: matches.map(({ roomId, roomPassword, ...match }: any) => match) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// TOURNAMENTS ENDPOINTS
// ----------------------------------------------------
app.get('/api/tournaments', (req: Request, res: Response) => {
  const tournaments = Object.values(db.tournaments);
  return res.json({ success: true, tournaments });
});

app.post('/api/tournaments/:id/notify', (req: Request, res: Response) => {
  const tourney = db.tournaments[req.params.id];
  if (!tourney) return res.status(404).json({ success: false, message: 'Tournament not found' });
  const { userId } = req.body;
  if (userId && !tourney.notifiedUserIds.includes(userId)) {
    tourney.notifiedUserIds.push(userId);
    dbManager.save();
  }
  return res.json({ success: true, message: "We'll notify you when registration opens!" });
});

// ----------------------------------------------------
// WALLET & TRANSACTIONS ENDPOINTS
// ----------------------------------------------------
app.get('/api/wallet/:userId', (req: Request, res: Response) => {
  const wallet = WalletService.getOrCreateWallet(req.params.userId);
  return res.json({ success: true, wallet });
});

app.get('/api/wallet/:userId/transactions', (req: Request, res: Response) => {
  const filter = req.query.filter as string;
  const transactions = WalletService.getTransactions(req.params.userId, filter);
  return res.json({ success: true, transactions });
});

app.post('/api/wallet/:userId/add-money', (req: Request, res: Response) => {
  try {
    const amount = Number(req.body.amount);
    const method = req.body.method || 'UPI / Google Pay';
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid deposit amount required' });
    }
    const { wallet, transaction } = WalletService.creditWallet(req.params.userId, amount, 'DEPOSIT', `Added ₹${amount} via ${method}`);
    return res.json({ success: true, message: `₹${amount} added successfully`, wallet, transaction });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/wallet/:userId/withdraw', (req: Request, res: Response) => {
  try {
    const amount = Number(req.body.amount);
    const upiId = req.body.upiId;

    if (!amount || !upiId) {
      return res.status(400).json({ success: false, message: 'Amount and UPI ID are required' });
    }

    const { withdrawal, wallet } = WalletService.reserveWithdrawal(req.params.userId, amount, upiId);

    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully!',
      withdrawal,
      wallet
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// NOTIFICATIONS & SUPPORT ENDPOINTS
// ----------------------------------------------------
app.get('/api/notifications/:userId', (req: Request, res: Response) => {
  const list = Object.values(db.notifications).filter(n => n.userId === req.params.userId);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, notifications: list });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications[req.params.id];
  if (notif) {
    notif.read = true;
    dbManager.save();
  }
  return res.json({ success: true });
});

app.get('/api/settings', (req: Request, res: Response) => {
  return res.json({ success: true, settings: db.appSettings });
});

app.post('/api/support/ticket', (req: Request, res: Response) => {
  const { userId, subject, message, category } = req.body;
  const ticketId = 'TCK_' + Date.now();
  db.supportTickets[ticketId] = {
    id: ticketId,
    userId: userId || 'anonymous',
    subject,
    message,
    category: category || 'OTHER',
    status: 'OPEN',
    createdAt: new Date().toISOString()
  };
  dbManager.save();
  return res.json({ success: true, message: 'Support ticket submitted successfully!', ticketId });
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------
// Background auto-promoter for scheduled match start times
setInterval(() => {
  try {
    MatchService.checkAndAutoPromoteMatches();
  } catch (err) {
    // Ignore background check errors
  }
}, 10000);

app.get('/api/admin/metrics', (req: Request, res: Response) => {
  MatchService.checkAndAutoPromoteMatches();
  const totalUsers = Object.keys(db.users).length;
  const matchesList = Object.values(db.matches);
  const totalMatches = matchesList.length;
  const liveMatches = matchesList.filter(m => m.status === 'LIVE').length;
  const completedMatches = matchesList.filter(m => m.status === 'COMPLETED').length;
  const totalRegistrations = Object.keys(db.matchRegistrations).length;

  const withdrawalsList = Object.values(db.withdrawals);
  const pendingWithdrawals = withdrawalsList.filter(w => w.status === 'PENDING').length;

  const totalPrizeDistributed = Object.values(db.walletTransactions)
    .filter(t => t.type === 'MATCH_WINNING' || t.type === 'KILL_REWARD')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeposits = Object.values(db.walletTransactions)
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = Object.values(db.walletTransactions)
    .filter(t => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  return res.json({
    success: true,
    metrics: {
      totalUsers,
      totalMatches,
      liveMatches,
      completedMatches,
      totalRegistrations,
      pendingWithdrawals,
      totalPrizeDistributed,
      totalDeposits,
      totalWithdrawals
    }
  });
});

app.post('/api/admin/matches', (req: Request, res: Response) => {
  try {
    const matchData = req.body;
    const matchId = 'match_' + Date.now();
    const matchCode = matchData.matchCode || getNextMatchCode();
    const mapName = matchData.map || 'Bermuda';
    const modeName = matchData.mode || 'SOLO';
    const newMatch: Match = {
      id: matchId,
      matchCode: matchCode,
      title: matchData.title || `${mapName} ${modeName} (${matchCode})`,
      category: matchData.category || 'BATTLE_ROYALE',
      mode: modeName,
      matchType: matchData.matchType || 'BOOYAH',
      map: mapName,
      bannerUrl: matchData.bannerUrl || '/shared-assets/bermuda.jpg',
      entryFee: Number(matchData.entryFee) || 0,
      prizePool: Number(matchData.prizePool) || 0,
      firstPrize: Number(matchData.firstPrize) || 0,
      secondPrize: Number(matchData.secondPrize) || 0,
      thirdPrize: Number(matchData.thirdPrize) || 0,
      perKillReward: Number(matchData.perKillReward) || 0,
      maxSlots: Number(matchData.maxSlots) || 48,
      registeredCount: 0,
      matchDate: matchData.matchDate || 'Nov 12, 2026',
      matchTime: matchData.matchTime || '08:00 PM',
      status: 'UPCOMING',
      rules: matchData.rules || ['Strictly mobile devices only.', 'Room ID will be given 15 mins prior.'],
      description: matchData.description || 'Compete in Free Fire tournament and win prizes.',
      createdAt: new Date().toISOString()
    };

    db.matches[matchId] = newMatch;
    dbManager.logAudit('MATCH_CREATED', 'admin', 'match', matchId, newMatch);
    dbManager.save();
    broadcastRealtimeEvent('MATCH_CREATED', newMatch);

    return res.json({ success: true, match: newMatch });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/matches/:id', (req: Request, res: Response) => {
  const match = db.matches[req.params.id];
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  Object.assign(match, req.body);
  dbManager.logAudit('MATCH_UPDATED', 'admin', 'match', match.id, req.body);
  dbManager.save();
  broadcastRealtimeEvent('MATCH_UPDATED', match);

  return res.json({ success: true, match });
});

app.post('/api/admin/matches/:id/room', (req: Request, res: Response) => {
  try {
    const { roomId, roomPassword } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'Room ID is required' });

    const match = MatchService.setRoomCredentials(req.params.id, roomId, roomPassword, 'admin');
    broadcastRealtimeEvent('ROOM_PUBLISHED', { matchId: req.params.id, roomId, roomPassword, match });
    return res.json({ success: true, match });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/matches/:id/results/booyah', (req: Request, res: Response) => {
  try {
    const { rankings } = req.body;
    if (!Array.isArray(rankings)) {
      return res.status(400).json({ success: false, message: 'Rankings array required' });
    }
    const result = ResultService.distributeBooyahResults(req.params.id, rankings, 'admin');
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/matches/:id/results/kill', (req: Request, res: Response) => {
  try {
    const { killRecords } = req.body;
    if (!Array.isArray(killRecords)) {
      return res.status(400).json({ success: false, message: 'Kill records array required' });
    }
    const result = ResultService.distributeKillResults(req.params.id, killRecords, 'admin');
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// COMPREHENSIVE MATCH COMPLETION & MANUAL SCORE VERIFICATION DISBURSEMENT
app.post('/api/admin/matches/:id/results/submit-all', (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const match = db.matches[matchId];
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const { playerResults } = req.body;
    if (!Array.isArray(playerResults)) {
      return res.status(400).json({ success: false, message: 'playerResults array is required' });
    }

    let totalDisbursed = 0;
    const processed: any[] = [];

    for (const p of playerResults) {
      const reward = Number(p.totalReward || p.reward || p.prize || 0);
      const kills = Number(p.kills || 0);
      const rank = p.rank ? Number(p.rank) : undefined;

      if (reward > 0 && p.userId) {
        WalletService.creditWallet(
          p.userId,
          reward,
          'MATCH_WINNING',
          `Match Reward: ${match.title}${rank ? ` • Rank #${rank}` : ''}${kills > 0 ? ` • ${kills} Kills` : ''}`,
          matchId
        );
        totalDisbursed += reward;

        const notifId = 'NTF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        db.notifications[notifId] = {
          id: notifId,
          userId: p.userId,
          title: `🏆 Won ₹${reward} in ${match.title}!`,
          message: `Score verified: ${rank ? `Rank #${rank}` : ''}${kills > 0 ? ` • ${kills} Kills` : ''}. ₹${reward} has been credited to your wallet balance.`,
          type: 'PRIZE_WON',
          read: false,
          createdAt: new Date().toISOString()
        };
      }

      processed.push({
        userId: p.userId,
        ign: p.ign || 'Player',
        ffUid: p.ffUid || 'N/A',
        kills,
        rank,
        reward
      });
    }

    match.status = 'COMPLETED';

    const resultId = 'RES_' + matchId;
    db.matchResults[resultId] = {
      id: resultId,
      matchId,
      matchType: match.matchType,
      rankings: processed.filter(p => p.rank).map(p => ({ rank: p.rank!, userId: p.userId, ign: p.ign, ffUid: p.ffUid, prize: p.reward })),
      killCounts: processed.map(p => ({ userId: p.userId, ign: p.ign, ffUid: p.ffUid, kills: p.kills, reward: p.reward })),
      verifiedBy: 'admin',
      verifiedAt: new Date().toISOString(),
      status: 'APPROVED'
    };

    dbManager.logAudit('MATCH_RESULTS_COMPLETED', 'admin', 'match', matchId, {
      totalDisbursed,
      playersCount: playerResults.length
    });
    dbManager.save();
    broadcastRealtimeEvent('RESULTS_DISBURSED', { matchId, totalDisbursed, match, playerResults });

    return res.json({ success: true, message: `Results submitted! ₹${totalDisbursed} credited to winning players.`, totalDisbursed, match });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/withdrawals', (req: Request, res: Response) => {
  const list = Object.values(db.withdrawals);
  list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  return res.json({ success: true, withdrawals: list });
});

app.post('/api/admin/withdrawals/:id/action', (req: Request, res: Response) => {
  try {
    const { approve, payoutTxnId, reason } = req.body;
    const result = WalletService.settleWithdrawal(req.params.id, Boolean(approve), 'admin', payoutTxnId, reason);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  const users = Object.values(db.users).map(u => {
    const wallet = WalletService.getOrCreateWallet(u.id);
    return {
      ...u,
      walletBalance: wallet.availableBalance
    };
  });
  return res.json({ success: true, users });
});

app.post('/api/admin/users/:id/ban', (req: Request, res: Response) => {
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isBanned = !user.isBanned;
  dbManager.logAudit(user.isBanned ? 'USER_BANNED' : 'USER_UNBANNED', 'admin', 'user', user.id, {});
  dbManager.save();
  return res.json({ success: true, user });
});

app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  return res.json({ success: true, auditLogs: db.auditLogs.slice(0, 100) });
});

// GET MATCH PARTICIPANTS
app.get('/api/admin/matches/:id/participants', (req: Request, res: Response) => {
  const matchId = req.params.id;
  const match = db.matches[matchId];
  if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

  const participants = Object.values(db.matchRegistrations)
    .filter(r => r.matchId === matchId && r.status === 'CONFIRMED')
    .map(r => {
      const user = db.users[r.userId];
      const wallet = WalletService.getOrCreateWallet(r.userId);
      const userRegs = Object.values(db.matchRegistrations).filter(x => x.userId === r.userId);
      return {
        ...r,
        userName: user?.name || r.ign,
        userPhone: user?.phone || '',
        userEmail: user?.email || '',
        walletBalance: wallet.availableBalance,
        matchesPlayed: userRegs.length,
        totalKills: (user as any)?.stats?.totalKills || 0,
        totalEarnings: (user as any)?.stats?.totalEarnings || 0
      };
    });

  return res.json({ success: true, match, participants });
});

// DELETE / CANCEL MATCH WITH AUTO-REFUND
app.delete('/api/admin/matches/:id', (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const match = db.matches[matchId];
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Refund all registered users
    const regs = Object.values(db.matchRegistrations).filter(r => r.matchId === matchId && r.status === 'CONFIRMED');
    let refundCount = 0;
    for (const reg of regs) {
      if (reg.entryFeePaid > 0) {
        WalletService.creditWallet(
          reg.userId,
          reg.entryFeePaid,
          'REFUND',
          `Refund: Match ${match.title} cancelled by administrator`,
          matchId
        );
        refundCount++;
      }
      reg.status = 'CANCELLED';
    }

    match.status = 'CANCELLED';
    delete db.matches[matchId];
    dbManager.logAudit('MATCH_DELETED_AND_REFUNDED', 'admin', 'match', matchId, { refundCount, matchTitle: match.title });
    dbManager.save();
    broadcastRealtimeEvent('MATCH_DELETED', { matchId, refundCount });

    return res.json({ success: true, message: `Match cancelled. ${refundCount} participants refunded successfully.` });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// USER WALLET ADJUSTMENT (CREDIT / DEBIT BY ADMIN)
app.post('/api/admin/users/:id/wallet-adjust', (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = db.users[userId];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { amount, type, reason } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount required' });
    }

    let result;
    if (type === 'CREDIT') {
      result = WalletService.creditWallet(userId, numAmount, 'BONUS', reason || 'Admin wallet credit');
    } else if (type === 'DEBIT') {
      result = WalletService.debitWallet(userId, numAmount, 'PENALTY', reason || 'Admin wallet debit');
    } else {
      return res.status(400).json({ success: false, message: 'Type must be CREDIT or DEBIT' });
    }

    dbManager.logAudit('ADMIN_WALLET_ADJUST', 'admin', 'user', userId, { amount: numAmount, type, reason });
    dbManager.save();
    broadcastRealtimeEvent('WALLET_UPDATED', { userId, amount: numAmount, type, wallet: result.wallet });

    return res.json({ success: true, ...result, user: db.users[userId] });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE USER PROFILE
app.put('/api/admin/users/:id', (req: Request, res: Response) => {
  const user = db.users[req.params.id];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { ign, ffUid, phone, name, state, country } = req.body;
  if (ign !== undefined) user.ign = ign;
  if (ffUid !== undefined) user.ffUid = ffUid;
  if (phone !== undefined) user.phone = phone;
  if (name !== undefined) user.name = name;
  if (state !== undefined) user.state = state;
  if (country !== undefined) user.country = country;

  dbManager.logAudit('USER_UPDATED_BY_ADMIN', 'admin', 'user', user.id, req.body);
  dbManager.save();

  return res.json({ success: true, user });
});

// ----------------------------------------------------
// EXTENDED ADMIN CAPABILITIES: FULL APP CONTROL
// ----------------------------------------------------

// 1. GET FULL USER DETAILS (PROFILE + WALLET + MATCHES + TRANSACTIONS)
app.get('/api/admin/users/:id/details', (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const wallet = WalletService.getOrCreateWallet(userId);
  const registrations = Object.values(db.matchRegistrations)
    .filter(r => r.userId === userId)
    .map(r => ({
      ...r,
      match: db.matches[r.matchId] || null
    }));

  const transactions = Object.values(db.walletTransactions)
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tickets = Object.values(db.supportTickets)
    .filter(t => t.userId === userId);

  return res.json({
    success: true,
    user,
    wallet,
    registrations,
    transactions,
    tickets
  });
});

// 2. ADMIN ADD PARTICIPANT TO MATCH
app.post('/api/admin/matches/:id/participants/add', (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const match = db.matches[matchId];
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const { userId, deductFee } = req.body;
    const user = db.users[userId];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check existing
    const existing = Object.values(db.matchRegistrations).find(
      r => r.matchId === matchId && r.userId === userId && r.status === 'CONFIRMED'
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Player is already registered for this match' });
    }

    if (match.registeredCount >= match.maxSlots) {
      return res.status(400).json({ success: false, message: 'Match is already at max capacity' });
    }

    let feePaid = 0;
    if (deductFee && match.entryFee > 0) {
      WalletService.debitWallet(userId, match.entryFee, 'ENTRY_FEE', `Entry fee for match: ${match.title}`, matchId);
      feePaid = match.entryFee;
    }

    const regId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const reg: MatchRegistration = {
      id: regId,
      matchId,
      userId,
      ign: user.ign || user.name || 'Player',
      ffUid: user.ffUid || 'N/A',
      slotNumber: match.registeredCount + 1,
      entryFeePaid: feePaid,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString()
    };

    db.matchRegistrations[regId] = reg;
    match.registeredCount += 1;

    // Send notification
    const notifId = 'notif_' + Date.now();
    db.notifications[notifId] = {
      id: notifId,
      userId,
      title: 'Slot Confirmed by Admin',
      message: `You were enrolled into match: ${match.title} (Slot #${reg.slotNumber})`,
      type: 'MATCH_JOINED',
      read: false,
      createdAt: new Date().toISOString()
    };

    dbManager.logAudit('ADMIN_MANUAL_ENROLL', 'admin', 'match', matchId, { userId, ign: reg.ign, feePaid });
    dbManager.save();

    return res.json({ success: true, registration: reg, match });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 3. ADMIN REMOVE / KICK PARTICIPANT FROM MATCH (WITH AUTO REFUND)
app.delete('/api/admin/matches/:id/participants/:userId', (req: Request, res: Response) => {
  try {
    const { id: matchId, userId } = req.params;
    const match = db.matches[matchId];
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const reg = Object.values(db.matchRegistrations).find(
      r => r.matchId === matchId && r.userId === userId && r.status === 'CONFIRMED'
    );
    if (!reg) return res.status(404).json({ success: false, message: 'Active registration not found' });

    let refundAmount = 0;
    if (reg.entryFeePaid > 0) {
      WalletService.creditWallet(userId, reg.entryFeePaid, 'REFUND', `Refund: Removed from ${match.title} by admin`, matchId);
      refundAmount = reg.entryFeePaid;
    }

    reg.status = 'CANCELLED';
    const teamSize = (reg.teammateUids && reg.teammateUids.length > 0 ? reg.teammateUids.length + 1 : 1);
    match.registeredCount = Math.max(0, match.registeredCount - teamSize);

    // Notify player
    const notifId = 'notif_' + Date.now();
    db.notifications[notifId] = {
      id: notifId,
      userId,
      title: 'Match Slot Cancelled',
      message: `You have been removed from ${match.title}.${refundAmount > 0 ? ` ₹${refundAmount} has been refunded to your wallet.` : ''}`,
      type: 'ANNOUNCEMENT',
      read: false,
      createdAt: new Date().toISOString()
    };

    dbManager.logAudit('ADMIN_KICK_PARTICIPANT', 'admin', 'match', matchId, { userId, refundAmount });
    dbManager.save();

    return res.json({ success: true, message: `Player removed and ₹${refundAmount} refunded.`, match });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 4. PLATFORM-WIDE TRANSACTION LEDGER
app.get('/api/admin/transactions', (req: Request, res: Response) => {
  try {
    const { type, search, userId } = req.query;
    let list = Object.values(db.walletTransactions);

    if (userId && typeof userId === 'string') {
      list = list.filter(t => t.userId === userId);
    }

    if (type && type !== 'ALL') {
      list = list.filter(t => t.type === type);
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.txHash.toLowerCase().includes(q) ||
        t.userId.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Attach user metadata
    const enriched = list.map(t => {
      const u = db.users[t.userId];
      return {
        ...t,
        userName: u?.name || 'Unknown Player',
        userIgn: u?.ign || 'N/A',
        userPhone: u?.phone || ''
      };
    });

    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ success: true, transactions: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. MASS WALLET BONUS / VOUCHER CREDIT
app.post('/api/admin/wallet/mass-bonus', (req: Request, res: Response) => {
  try {
    const { amount, reason } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive bonus amount required' });
    }

    const allUsers = Object.values(db.users).filter(u => !u.isBanned);
    let creditedCount = 0;

    for (const u of allUsers) {
      WalletService.creditWallet(u.id, numAmount, 'BONUS', reason || 'Community Championship Bonus');
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3);
      db.notifications[notifId] = {
        id: notifId,
        userId: u.id,
        title: '🎁 Special Bonus Credited!',
        message: `₹${numAmount} has been added to your wallet! ${reason || ''}`,
        type: 'PRIZE_WON',
        read: false,
        createdAt: new Date().toISOString()
      };
      creditedCount++;
    }

    dbManager.logAudit('ADMIN_MASS_BONUS', 'admin', 'wallet', 'all_users', { count: creditedCount, amount: numAmount, reason });
    dbManager.save();

    return res.json({ success: true, message: `Successfully credited ₹${numAmount} to ${creditedCount} players!`, creditedCount });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 6. TOURNAMENTS CRUD & BROADCAST
app.get('/api/admin/tournaments', (req: Request, res: Response) => {
  const tournaments = Object.values(db.tournaments);
  tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, tournaments });
});

app.post('/api/admin/tournaments', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = 'tourney_' + Date.now();
    const tourney: Tournament = {
      id,
      title: data.title || 'New Grand Tournament',
      subtitle: data.subtitle || 'Championship Battle',
      description: data.description || 'Join and prove your skills!',
      bannerUrl: data.bannerUrl || '/shared-assets/ff_play_compete_win.jpg',
      prizePool: Number(data.prizePool) || 10000,
      status: data.status || 'COMING_SOON',
      notifiedUserIds: [],
      createdAt: new Date().toISOString()
    };

    db.tournaments[id] = tourney;
    dbManager.logAudit('TOURNAMENT_CREATED', 'admin', 'tournament', id, tourney);
    dbManager.save();

    return res.json({ success: true, tournament: tourney });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/tournaments/:id', (req: Request, res: Response) => {
  const tourney = db.tournaments[req.params.id];
  if (!tourney) return res.status(404).json({ success: false, message: 'Tournament not found' });

  Object.assign(tourney, req.body);
  dbManager.logAudit('TOURNAMENT_UPDATED', 'admin', 'tournament', tourney.id, req.body);
  dbManager.save();

  return res.json({ success: true, tournament: tourney });
});

app.delete('/api/admin/tournaments/:id', (req: Request, res: Response) => {
  const tourney = db.tournaments[req.params.id];
  if (!tourney) return res.status(404).json({ success: false, message: 'Tournament not found' });

  delete db.tournaments[req.params.id];
  dbManager.logAudit('TOURNAMENT_DELETED', 'admin', 'tournament', req.params.id, { title: tourney.title });
  dbManager.save();

  return res.json({ success: true, message: 'Tournament deleted successfully' });
});

app.post('/api/admin/tournaments/:id/broadcast', (req: Request, res: Response) => {
  const tourney = db.tournaments[req.params.id];
  if (!tourney) return res.status(404).json({ success: false, message: 'Tournament not found' });

  const allUsers = Object.values(db.users);
  for (const u of allUsers) {
    const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3);
    db.notifications[notifId] = {
      id: notifId,
      userId: u.id,
      title: `🏆 Tournament: ${tourney.title}`,
      message: `${tourney.subtitle} - Total Prize Pool ₹${tourney.prizePool.toLocaleString()}! Check tournaments now.`,
      type: 'ANNOUNCEMENT',
      read: false,
      createdAt: new Date().toISOString()
    };
  }

  dbManager.logAudit('TOURNAMENT_BROADCAST', 'admin', 'tournament', tourney.id, { notifiedCount: allUsers.length });
  dbManager.save();

  return res.json({ success: true, message: `Notification broadcasted to ${allUsers.length} players!` });
});

// 7. SUPPORT TICKETS MANAGEMENT
app.get('/api/admin/support/tickets', (req: Request, res: Response) => {
  const tickets = Object.values(db.supportTickets).map(t => {
    const u = db.users[t.userId];
    return {
      ...t,
      userName: u?.name || 'Anonymous',
      userIgn: u?.ign || 'N/A',
      userPhone: u?.phone || '',
      userEmail: u?.email || ''
    };
  });
  tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, tickets });
});

app.post('/api/admin/support/tickets/:id/reply', (req: Request, res: Response) => {
  const ticket = db.supportTickets[req.params.id];
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const { adminReply, status } = req.body;
  if (adminReply) ticket.adminReply = adminReply;
  if (status) ticket.status = status;
  ticket.resolvedAt = new Date().toISOString();
  ticket.resolvedBy = 'admin';

  // Send notification to player
  const notifId = 'notif_' + Date.now();
  db.notifications[notifId] = {
    id: notifId,
    userId: ticket.userId,
    title: 'Support Ticket Update',
    message: `Re: ${ticket.subject} — ${adminReply || 'Your support request has been updated to ' + status}`,
    type: 'ANNOUNCEMENT',
    read: false,
    createdAt: new Date().toISOString()
  };

  dbManager.logAudit('SUPPORT_TICKET_REPLIED', 'admin', 'ticket', ticket.id, { status, adminReply });
  dbManager.save();

  return res.json({ success: true, ticket });
});

// 8. APP SETTINGS & LIVE CONTROLLABILITY
app.get('/api/admin/settings', (req: Request, res: Response) => {
  return res.json({ success: true, settings: db.appSettings });
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  try {
    Object.assign(db.appSettings, req.body);
    dbManager.logAudit('APP_SETTINGS_UPDATED', 'admin', 'settings', 'global', req.body);
    dbManager.save();
    broadcastRealtimeEvent('SETTINGS_UPDATED', db.appSettings);
    return res.json({ success: true, settings: db.appSettings, message: 'Settings saved successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 9. INSTANT IN-APP BROADCAST TO ALL PLAYERS
app.post('/api/admin/broadcast-notification', (req: Request, res: Response) => {
  try {
    const { title, message, type, userId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const recipients = (userId && userId !== 'ALL')
      ? [db.users[userId]].filter(Boolean)
      : Object.values(db.users);

    for (const u of recipients) {
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      db.notifications[notifId] = {
        id: notifId,
        userId: u.id,
        title,
        message,
        type: type || 'ANNOUNCEMENT',
        read: false,
        createdAt: new Date().toISOString()
      };
    }

    dbManager.logAudit('ADMIN_BROADCAST_SENT', 'admin', 'notification', userId || 'ALL', { title, count: recipients.length });
    dbManager.save();
    broadcastRealtimeEvent('BROADCAST_NOTIFICATION', { title, message, type: type || 'ANNOUNCEMENT', count: recipients.length });

    return res.json({ success: true, message: `Notification sent to ${recipients.length} users!` });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 10. SYSTEM HEALTH & DIAGNOSTICS
app.get('/api/admin/system/diagnostics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  return res.json({
    success: true,
    diagnostics: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      counts: {
        users: Object.keys(db.users).length,
        matches: Object.keys(db.matches).length,
        registrations: Object.keys(db.matchRegistrations).length,
        transactions: Object.keys(db.walletTransactions).length,
        withdrawals: Object.keys(db.withdrawals).length,
        tournaments: Object.keys(db.tournaments).length,
        tickets: Object.keys(db.supportTickets).length,
        auditLogs: db.auditLogs.length
      },
      serverTime: new Date().toISOString()
    }
  });
});

// 11. FULL DATABASE JSON BACKUP
app.get('/api/admin/system/backup', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ffesports_backup_${Date.now()}.json`);
  return res.send(JSON.stringify(db, null, 2));
});

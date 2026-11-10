import { dbManager, db } from '../storage/db';
import { Match, MatchRegistration, AppNotification } from '../types';
import { WalletService } from './walletService';

export class MatchService {
  public static checkAndAutoPromoteMatches(): void {
    const now = new Date();
    let hasChanges = false;

    Object.values(db.matches).forEach(m => {
      if (m.status === 'UPCOMING') {
        try {
          if (m.matchDate && m.matchTime) {
            const timeStr = `${m.matchDate} ${m.matchTime}`;
            const parsedDate = new Date(timeStr);
            if (!isNaN(parsedDate.getTime()) && parsedDate <= now) {
              m.status = 'LIVE';
              hasChanges = true;
              dbManager.logAudit('MATCH_AUTO_PROMOTED_TO_LIVE', 'system', 'match', m.id, {
                scheduledTime: timeStr,
                promotedAt: now.toISOString()
              });
              (global as any).broadcastRealtimeEvent?.('MATCH_AUTO_PROMOTED', { matchId: m.id, status: 'LIVE', match: m });
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    if (hasChanges) {
      dbManager.save();
    }
  }

  public static getAllMatches(filters?: {
    mode?: string;
    map?: string;
    matchType?: string;
    search?: string;
    status?: string;
  }): Match[] {
    MatchService.checkAndAutoPromoteMatches();
    let list = Object.values(db.matches);

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter(m => m.status === filters.status);
    } else if (!filters?.status) {
      list = list.filter(m => m.status !== 'CANCELLED');
    }

    if (filters?.mode && filters.mode !== 'ALL') {
      list = list.filter(m => m.mode.toUpperCase() === filters.mode?.toUpperCase());
    }

    if (filters?.map && filters.map !== 'ALL') {
      list = list.filter(m => m.map.toLowerCase().includes(filters.map!.toLowerCase()));
    }

    if (filters?.matchType && filters.matchType !== 'ALL') {
      list = list.filter(m => m.matchType.toUpperCase() === filters.matchType?.toUpperCase());
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(m =>
        (m.matchCode && m.matchCode.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        m.map.toLowerCase().includes(q) ||
        m.mode.toLowerCase().includes(q) ||
        m.matchType.toLowerCase().includes(q) ||
        m.entryFee.toString().includes(q) ||
        m.prizePool.toString().includes(q)
      );
    }

    // Sort upcoming first
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }

  public static getMatchById(matchId: string): Match | undefined {
    return db.matches[matchId];
  }

  public static parseMatchTime(matchDate?: string, matchTime?: string): number | null {
    if (!matchTime) return null;
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();

    if (matchDate && matchDate.toLowerCase() !== 'today') {
      const parsedD = new Date(matchDate);
      if (!isNaN(parsedD.getTime())) {
        year = parsedD.getFullYear();
        month = parsedD.getMonth();
        day = parsedD.getDate();
      }
    }

    const m = matchTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const meridiem = m[3] ? m[3].toUpperCase() : null;

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const dt = new Date(year, month, day, hours, minutes, 0, 0);
    return dt.getTime();
  }

  public static registerUser(
    userId: string,
    matchId: string,
    teamMembers?: { ign?: string; ffUid: string }[],
    teammateUids?: string[],
    selectedSlot?: number
  ): { registration: MatchRegistration; match: Match } {
    const user = db.users[userId];
    if (!user) {
      throw new Error('User profile not found. Please log in.');
    }
    if (!user.ffUid) {
      throw new Error('Please enter your Free Fire UID before joining a match.');
    }

    const match = db.matches[matchId];
    if (!match) {
      throw new Error('Match not found');
    }
    if (match.status !== 'UPCOMING') {
      throw new Error(`Match registration is not available (Status: ${match.status})`);
    }

    const rawMode = (match.mode || '').toUpperCase();
    const rawCategory = (match.category || '').toUpperCase();
    const allModeText = `${rawMode} ${(match.title || '').toUpperCase()}`;
    const isClash = rawCategory === 'CLASH_SQUAD' || allModeText.includes('CLASH');

    let teamSize = 1;
    let totalSlotsOrTeams = match.maxSlots || 48;

    if (allModeText.includes('6V6')) {
      teamSize = 6;
      totalSlotsOrTeams = 2;
    } else if (allModeText.includes('4V4') || (isClash && !allModeText.includes('2V2') && !allModeText.includes('1V1'))) {
      teamSize = 4;
      totalSlotsOrTeams = 2;
    } else if (allModeText.includes('2V2')) {
      teamSize = 2;
      totalSlotsOrTeams = 2;
    } else if (allModeText.includes('1V1')) {
      teamSize = 1;
      totalSlotsOrTeams = 2;
    } else if (allModeText.includes('SQUAD')) {
      teamSize = 4;
      totalSlotsOrTeams = Math.max(1, Math.floor((match.maxSlots || 48) / 4));
    } else if (allModeText.includes('DUO')) {
      teamSize = 2;
      totalSlotsOrTeams = Math.max(1, Math.floor((match.maxSlots || 48) / 2));
    } else {
      teamSize = 1;
      totalSlotsOrTeams = match.maxSlots || 48;
    }

    if (match.registeredCount + teamSize > match.maxSlots) {
      const remainingSlots = Math.max(0, match.maxSlots - match.registeredCount);
      const remainingTeams = Math.floor(remainingSlots / teamSize);
      throw new Error(`Match is full! Only ${teamSize > 1 ? `${remainingTeams} team slots` : `${remainingSlots} slots`} remaining.`);
    }

    // Check duplicate
    const alreadyRegistered = Object.values(db.matchRegistrations).some(
      r => r.matchId === matchId && r.userId === userId && r.status === 'CONFIRMED'
    );
    if (alreadyRegistered) {
      throw new Error('You are already registered for this match.');
    }

    // Validate or allocate chosen slot
    let assignedSlot = 1;
    const takenSlots = new Set(
      Object.values(db.matchRegistrations)
        .filter(r => r.matchId === matchId && r.status === 'CONFIRMED')
        .map(r => r.slotNumber)
    );

    if (selectedSlot && selectedSlot >= 1 && selectedSlot <= totalSlotsOrTeams) {
      if (takenSlots.has(selectedSlot)) {
        throw new Error(`Slot #${selectedSlot} has already been reserved by another player. Please select an available slot.`);
      }
      assignedSlot = selectedSlot;
    } else {
      for (let s = 1; s <= totalSlotsOrTeams; s++) {
        if (!takenSlots.has(s)) {
          assignedSlot = s;
          break;
        }
      }
    }

    // Atomic debit of entry fee
    WalletService.debitWallet(
      userId,
      match.entryFee,
      'ENTRY_FEE',
      `Match Registration - ${match.title}`,
      matchId
    );

    match.registeredCount += teamSize;
    const assignedTeamNumber = assignedSlot;

    const regId = 'REG_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const uids = teammateUids || (teamMembers ? teamMembers.map(m => m.ffUid) : []);
    const reg: MatchRegistration = {
      id: regId,
      matchId,
      userId,
      ign: user.ign,
      ffUid: user.ffUid,
      teammateUids: uids,
      slotNumber: assignedSlot,
      entryFeePaid: match.entryFee,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString()
    };

    db.matchRegistrations[regId] = reg;

    // Send In-App Notification
    const notifId = 'NTF_' + Date.now();
    const notif: AppNotification = {
      id: notifId,
      userId,
      title: 'Slot Confirmed: ' + match.title,
      message: `Your registration for ${match.title} (Team #${assignedTeamNumber}) is confirmed. Room details will unlock 5 minutes before match start.`,
      type: 'MATCH_JOINED',
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications[notifId] = notif;

    dbManager.logAudit('MATCH_REGISTRATION', userId, 'match', matchId, {
      registrationId: regId,
      slotNumber: assignedSlot,
      entryFee: match.entryFee
    });

    dbManager.save();

    return { registration: reg, match };
  }

  public static getMyMatches(userId: string, filter?: 'UPCOMING' | 'LIVE' | 'COMPLETED'): any[] {
    const userRegs = Object.values(db.matchRegistrations).filter(
      r => r.userId === userId && r.status === 'CONFIRMED'
    );

    const matchIds = userRegs.map(r => r.matchId);
    let myMatches = matchIds
      .map(id => db.matches[id])
      .filter((m): m is Match => m !== undefined);

    if (filter) {
      myMatches = myMatches.filter(m => m.status === filter);
    }

    return myMatches.map(m => {
      const reg = userRegs.find(r => r.matchId === m.id);
      return {
        ...m,
        registration: reg,
        hasRoomAccess: true
      };
    });
  }

  public static getRoomCredentials(matchId: string, userId: string) {
    const match = db.matches[matchId];
    if (!match) throw new Error('Match not found');

    // Verify registration
    const userReg = Object.values(db.matchRegistrations).find(
      r => r.matchId === matchId && r.userId === userId && r.status === 'CONFIRMED'
    );

    if (!userReg) {
      throw new Error('Access denied. Only registered participants can view room details.');
    }

    const matchStartMs = MatchService.parseMatchTime(match.matchDate, match.matchTime);
    const revealTimeMs = matchStartMs ? matchStartMs - (5 * 60 * 1000) : 0;
    const now = Date.now();
    const isLiveOrDone = match.status === 'LIVE' || match.status === 'COMPLETED';
    const isUnlocked = isLiveOrDone || (revealTimeMs > 0 ? now >= revealTimeMs : true);

    if (!match.roomId) {
      return {
        isAvailable: false,
        isLocked: !isUnlocked,
        slotNumber: userReg.slotNumber,
        revealTimestamp: revealTimeMs,
        matchStartTimestamp: matchStartMs,
        message: 'Room credentials will be unlocked 5 minutes before match start time.'
      };
    }

    if (!isUnlocked && matchStartMs) {
      return {
        isAvailable: false,
        isLocked: true,
        slotNumber: userReg.slotNumber,
        revealTimestamp: revealTimeMs,
        matchStartTimestamp: matchStartMs,
        message: 'Room credentials unlock exactly 5 minutes before match start time.'
      };
    }

    return {
      isAvailable: true,
      isLocked: false,
      slotNumber: userReg.slotNumber,
      revealTimestamp: revealTimeMs,
      matchStartTimestamp: matchStartMs,
      roomId: match.roomId,
      roomPassword: match.roomPassword || '',
      matchTime: match.matchTime,
      map: match.map
    };
  }

  public static setRoomCredentials(matchId: string, roomId: string, roomPassword: string, adminId: string) {
    const match = db.matches[matchId];
    if (!match) throw new Error('Match not found');

    match.roomId = roomId;
    match.roomPassword = roomPassword;
    match.roomReleaseTime = new Date().toISOString();

    // Notify all registered players
    const registrations = Object.values(db.matchRegistrations).filter(
      r => r.matchId === matchId && r.status === 'CONFIRMED'
    );

    registrations.forEach(r => {
      const notifId = 'NTF_' + Date.now() + '_' + r.userId;
      db.notifications[notifId] = {
        id: notifId,
        userId: r.userId,
        title: 'Room Details Published!',
        message: `Room ID and Password are ready for ${match.title}. Join the custom room now!`,
        type: 'ROOM_DETAILS',
        read: false,
        createdAt: new Date().toISOString()
      };
    });

    dbManager.logAudit('ROOM_CREDENTIALS_PUBLISHED', adminId, 'match', matchId, { roomId });
    dbManager.save();

    return match;
  }
}

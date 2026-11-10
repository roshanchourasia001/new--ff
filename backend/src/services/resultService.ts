import { dbManager, db } from '../storage/db';
import { BooyahRanking, KillRecord, MatchResult, AppNotification } from '../types';
import { WalletService } from './walletService';

export class ResultService {
  public static distributeBooyahResults(
    matchId: string,
    rankings: BooyahRanking[],
    adminId: string
  ): MatchResult {
    const match = db.matches[matchId];
    if (!match) throw new Error('Match not found');
    if (match.matchType !== 'BOOYAH') {
      throw new Error(`Match ${matchId} is not a Booyah match`);
    }

    // Verify registrations
    const results: BooyahRanking[] = [];

    for (const r of rankings) {
      if (r.prize > 0) {
        // Credit winner wallet atomically
        WalletService.creditWallet(
          r.userId,
          r.prize,
          'MATCH_WINNING',
          `Booyah Rank #${r.rank} Prize - ${match.title}`,
          matchId
        );

        // Send winning notification
        const notifId = 'NTF_' + Date.now() + '_' + r.userId;
        db.notifications[notifId] = {
          id: notifId,
          userId: r.userId,
          title: `🏆 You Won ₹${r.prize}!`,
          message: `Congratulations on securing Rank #${r.rank} in ${match.title}! Prize money credited to your wallet.`,
          type: 'PRIZE_WON',
          read: false,
          createdAt: new Date().toISOString()
        };
      }
      results.push(r);
    }

    match.status = 'COMPLETED';

    const resultId = 'RES_' + matchId;
    const matchResult: MatchResult = {
      id: resultId,
      matchId,
      matchType: 'BOOYAH',
      rankings: results,
      verifiedBy: adminId,
      verifiedAt: new Date().toISOString(),
      status: 'APPROVED'
    };

    db.matchResults[resultId] = matchResult;

    dbManager.logAudit('BOOYAH_RESULTS_DISTRIBUTED', adminId, 'match', matchId, {
      payoutTotal: rankings.reduce((acc, curr) => acc + (curr.prize || 0), 0),
      winnersCount: rankings.length
    });

    dbManager.save();
    return matchResult;
  }

  public static distributeKillResults(
    matchId: string,
    killRecords: { userId: string; ign: string; ffUid: string; kills: number }[],
    adminId: string
  ): MatchResult {
    const match = db.matches[matchId];
    if (!match) throw new Error('Match not found');
    if (match.matchType !== 'KILL') {
      throw new Error(`Match ${matchId} is not a Per Kill match`);
    }

    const calculatedKills: KillRecord[] = [];
    let totalPayout = 0;

    for (const k of killRecords) {
      const reward = k.kills * match.perKillReward;
      if (reward > 0) {
        WalletService.creditWallet(
          k.userId,
          reward,
          'KILL_REWARD',
          `Per Kill Reward (${k.kills} Kills @ ₹${match.perKillReward}) - ${match.title}`,
          matchId
        );

        totalPayout += reward;

        // Send notification
        const notifId = 'NTF_' + Date.now() + '_' + k.userId;
        db.notifications[notifId] = {
          id: notifId,
          userId: k.userId,
          title: `🎯 ₹${reward} Kill Reward Credited!`,
          message: `You scored ${k.kills} kills in ${match.title}. ₹${reward} credited to your wallet balance.`,
          type: 'PRIZE_WON',
          read: false,
          createdAt: new Date().toISOString()
        };
      }

      calculatedKills.push({
        ...k,
        reward
      });
    }

    match.status = 'COMPLETED';

    const resultId = 'RES_' + matchId;
    const matchResult: MatchResult = {
      id: resultId,
      matchId,
      matchType: 'KILL',
      killCounts: calculatedKills,
      verifiedBy: adminId,
      verifiedAt: new Date().toISOString(),
      status: 'APPROVED'
    };

    db.matchResults[resultId] = matchResult;

    dbManager.logAudit('KILL_RESULTS_DISTRIBUTED', adminId, 'match', matchId, {
      totalPayout,
      playersCount: killRecords.length
    });

    dbManager.save();
    return matchResult;
  }
}

import { dbManager, db } from '../storage/db';

export function runSeed() {
  console.log('Seeding initial Free Fire Esports database...');

  // 1. Seed Main User (Roshan Chourasia)
  db.users['user_roshan'] = {
    id: 'user_roshan',
    name: 'Roshan Chourasia',
    ign: 'Roshan',
    ffUid: 'FF123456',
    email: 'roshan@ffesports.in',
    phone: '8949267586',
    age: 21,
    gender: 'Male',
    state: 'Uttarakhand',
    country: 'India',
    avatarUrl: '/shared-assets/avatar.jpg',
    isProfileComplete: true,
    isBanned: false,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: new Date().toISOString()
  };

  // 2. Seed Wallet (₹450 available balance, ₹1,250 total earnings, ₹800 total withdrawals)
  db.wallets['user_roshan'] = {
    userId: 'user_roshan',
    availableBalance: 450,
    pendingBalance: 0,
    totalEarnings: 1250,
    totalWithdrawals: 800,
    updatedAt: new Date().toISOString()
  };

  // 3. Seed Transactions
  db.walletTransactions['TXN12345'] = {
    id: 'TXN12345',
    userId: 'user_roshan',
    type: 'MATCH_WINNING',
    amount: 500,
    status: 'SUCCESS',
    description: 'Match Winnings - Bermuda Battle',
    matchId: 'match_1',
    txHash: '0x8FA43E',
    createdAt: '2026-11-07T12:00:00.000Z'
  };

  db.walletTransactions['TXN12344'] = {
    id: 'TXN12344',
    userId: 'user_roshan',
    type: 'ENTRY_FEE',
    amount: 20,
    status: 'SUCCESS',
    description: 'Match Registration - Duo Showdown',
    matchId: 'match_2',
    txHash: '0x99BB21',
    createdAt: '2026-11-06T17:20:00.000Z'
  };

  db.walletTransactions['TXN12343'] = {
    id: 'TXN12343',
    userId: 'user_roshan',
    type: 'WITHDRAWAL',
    amount: 800,
    status: 'SUCCESS',
    description: 'Withdrawal Request - UPI Payment',
    txHash: 'UPI_983726194',
    createdAt: '2026-11-05T21:15:00.000Z'
  };

  db.walletTransactions['TXN12342'] = {
    id: 'TXN12342',
    userId: 'user_roshan',
    type: 'MATCH_WINNING',
    amount: 350,
    status: 'SUCCESS',
    description: 'Match Winnings - Kalahari Fight',
    matchId: 'match_2',
    txHash: '0x43EEA1',
    createdAt: '2026-11-03T18:12:00.000Z'
  };

  // 4. Seed Matches
  db.matches['match_1'] = {
    id: 'match_1',
    title: 'Bermuda Solo Battle',
    category: 'BATTLE_ROYALE',
    mode: 'SOLO',
    matchType: 'BOOYAH',
    map: 'Bermuda',
    bannerUrl: '/shared-assets/bermuda.jpg',
    entryFee: 20,
    prizePool: 500,
    firstPrize: 300,
    secondPrize: 150,
    thirdPrize: 50,
    perKillReward: 0,
    maxSlots: 48,
    registeredCount: 32,
    matchDate: 'Nov 8, 2026',
    matchTime: '07:30 PM',
    status: 'UPCOMING',
    rules: [
      'No emulators or PC allowed. Strictly mobile devices only.',
      'Teaming up in Solo matches will lead to disqualification.',
      'Room ID and Password are sent 15 minutes before match start.',
      'Take screenshot of your final kill & rank screen for verification.',
      'Payouts are credited automatically within 15 minutes of match completion.'
    ],
    description: 'Fight for glory in Bermuda! Show your skills and win big rewards.',
    createdAt: '2026-11-06T10:00:00.000Z'
  };

  db.matches['match_2'] = {
    id: 'match_2',
    title: 'Duo Showdown',
    category: 'BATTLE_ROYALE',
    mode: 'DUO',
    matchType: 'BOOYAH',
    map: 'Kalahari',
    bannerUrl: '/shared-assets/kalahari.jpg',
    entryFee: 30,
    prizePool: 800,
    firstPrize: 500,
    secondPrize: 200,
    thirdPrize: 100,
    perKillReward: 0,
    maxSlots: 48,
    registeredCount: 24,
    matchDate: 'Nov 8, 2026',
    matchTime: '08:30 PM',
    status: 'UPCOMING',
    rules: [
      'Both duo partners must be registered.',
      'Mic communication enabled.',
      'Prizes split equally between teammates.'
    ],
    description: 'Team up with your duo partner and dominate the Kalahari desert!',
    createdAt: '2026-11-06T11:00:00.000Z'
  };

  db.matches['match_3'] = {
    id: 'match_3',
    title: 'Purgatory Kill Rush',
    category: 'BATTLE_ROYALE',
    mode: 'SOLO',
    matchType: 'KILL',
    map: 'Purgatory',
    bannerUrl: '/shared-assets/purgatory.jpg',
    entryFee: 30,
    prizePool: 1440,
    firstPrize: 0,
    perKillReward: 30,
    maxSlots: 48,
    registeredCount: 18,
    matchDate: 'Nov 9, 2026',
    matchTime: '06:00 PM',
    status: 'UPCOMING',
    rules: [
      'Every verified kill earns ₹30 directly into your wallet.',
      'No rank placement requirements - pure kills!',
      'Proof screenshots required for kill audits.'
    ],
    description: 'Pure aggression! Secure kills and win ₹30 for every kill you get!',
    createdAt: '2026-11-06T12:00:00.000Z'
  };

  db.matches['match_cs_1v1'] = {
    id: 'match_cs_1v1',
    title: 'Bermuda Clash Squad 1v1',
    category: 'CLASH_SQUAD',
    mode: '1V1',
    matchType: 'BOOYAH',
    map: 'Bermuda',
    bannerUrl: '/shared-assets/bermuda.jpg',
    entryFee: 50,
    prizePool: 90,
    firstPrize: 90,
    secondPrize: 0,
    thirdPrize: 0,
    perKillReward: 0,
    maxSlots: 2,
    registeredCount: 1,
    matchDate: 'Nov 9, 2026',
    matchTime: '08:30 PM',
    status: 'UPCOMING',
    rules: [
      'Clash Squad 1v1 Solo Duel Rules.',
      'Head-to-head 2 players. Best of 7 rounds.',
      'Strict mobile only. Emulators prohibited.',
      'Winner takes 90% of total entry pool (₹90).'
    ],
    description: 'Ultimate 1v1 Clash Squad Duel! 2 players fight head-to-head. Winner takes ₹90.',
    createdAt: '2026-11-06T12:30:00.000Z'
  };

  db.matches['match_cs_2v2'] = {
    id: 'match_cs_2v2',
    title: 'Purgatory Clash Squad 2v2',
    category: 'CLASH_SQUAD',
    mode: '2V2',
    matchType: 'BOOYAH',
    map: 'Purgatory',
    bannerUrl: '/shared-assets/purgatory.jpg',
    entryFee: 100,
    prizePool: 180,
    firstPrize: 180,
    secondPrize: 0,
    thirdPrize: 0,
    perKillReward: 0,
    maxSlots: 2,
    registeredCount: 1,
    matchDate: 'Nov 9, 2026',
    matchTime: '09:00 PM',
    status: 'UPCOMING',
    rules: [
      'Clash Squad 2v2 Duo Rules.',
      '2 Teams registered as units. Best of 7 rounds.',
      'Winner takes 90% of total entry pool (₹180).'
    ],
    description: 'Duo tactical Clash Squad! 2 teams head-to-head. Winner takes ₹180.',
    createdAt: '2026-11-06T12:45:00.000Z'
  };

  db.matches['match_4'] = {
    id: 'match_4',
    title: 'Nexterra Clash Squad 4v4',
    category: 'CLASH_SQUAD',
    mode: '4V4',
    matchType: 'BOOYAH',
    map: 'Nexterra',
    bannerUrl: '/shared-assets/nexterra.jpg',
    entryFee: 500,
    prizePool: 900,
    firstPrize: 900,
    secondPrize: 0,
    thirdPrize: 0,
    perKillReward: 0,
    maxSlots: 2,
    registeredCount: 1,
    matchDate: 'Nov 9, 2026',
    matchTime: '09:30 PM',
    status: 'UPCOMING',
    rules: [
      'Standard Clash Squad 4v4 Competitive Rules.',
      'Full squad registers as a single unit (2 squads total).',
      'Best of 7 rounds.',
      'Winner takes 90% of total entry pool (₹900).'
    ],
    description: 'Tactical 4v4 Clash Squad combat. 2 squads head-to-head. Winner takes ₹900.',
    createdAt: '2026-11-06T13:00:00.000Z'
  };

  db.matches['match_cs_6v6'] = {
    id: 'match_cs_6v6',
    title: 'Kalahari Clash Squad 6v6',
    category: 'CLASH_SQUAD',
    mode: '6V6',
    matchType: 'BOOYAH',
    map: 'Kalahari',
    bannerUrl: '/shared-assets/kalahari.jpg',
    entryFee: 300,
    prizePool: 540,
    firstPrize: 540,
    secondPrize: 0,
    thirdPrize: 0,
    perKillReward: 0,
    maxSlots: 2,
    registeredCount: 0,
    matchDate: 'Nov 9, 2026',
    matchTime: '10:00 PM',
    status: 'UPCOMING',
    rules: [
      'Clash Squad 6v6 Big Team Rules.',
      'Full 6-player team registers as a single unit (2 teams total).',
      'Best of 7 rounds.',
      'Winner takes 90% of total entry pool (₹540).'
    ],
    description: 'Epic 6v6 Clash Squad warfare! 2 teams head-to-head. Winner takes ₹540.',
    createdAt: '2026-11-06T13:15:00.000Z'
  };

  // 5. Seed Tournaments
  db.tournaments['tourney_grand'] = {
    id: 'tourney_grand',
    title: 'GRAND TOURNAMENT',
    subtitle: 'SOMETHING LEGENDARY IS COMING!',
    description: 'Get ready to compete with the best players and experience the ultimate esports battle. Big tournaments, bigger rewards. Stay tuned!',
    bannerUrl: '/shared-assets/ff_play_compete_win.jpg',
    prizePool: 50000,
    status: 'COMING_SOON',
    notifiedUserIds: ['user_roshan'],
    createdAt: '2026-11-01T00:00:00.000Z'
  };

  // 6. Seed Notifications
  db.notifications['notif_welcome'] = {
    id: 'notif_welcome',
    userId: 'user_roshan',
    title: 'Welcome to Free Fire Esports!',
    message: 'Your account is ready. Join matches, prove your skills, and earn cash rewards.',
    type: 'ANNOUNCEMENT',
    read: false,
    createdAt: '2026-11-07T10:00:00.000Z'
  };

  dbManager.save();
  console.log('Database seeded successfully!');
}

if (require.main === module) {
  runSeed();
}

export type GameMode = 'SOLO' | 'DUO' | 'SQUAD' | '1V1' | '2V2' | '4V4' | '6V6';
export type GameCategory = 'BATTLE_ROYALE' | 'CLASH_SQUAD';
export type MatchType = 'BOOYAH' | 'KILL';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type MapName = 'Bermuda' | 'Kalahari' | 'Purgatory' | 'Solara' | 'Nexterra';

export type TransactionType = 'DEPOSIT' | 'ENTRY_FEE' | 'MATCH_WINNING' | 'KILL_REWARD' | 'WITHDRAWAL' | 'REFUND' | 'BONUS' | 'PENALTY';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REJECTED';

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED';

export interface User {
  id: string;
  profileId?: string; // Human-readable Unique Profile ID (e.g. PID-1001)
  name: string;
  ign: string; // In-Game Name
  ffUid: string; // Free Fire UID
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  state: string;
  country: string;
  avatarUrl: string;
  isProfileComplete: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  matchCode?: string; // Human-readable Unique Match ID (e.g. M-101)
  title: string;
  category: GameCategory;
  mode: GameMode;
  matchType: MatchType; // BOOYAH or KILL
  map: MapName;
  bannerUrl: string;
  entryFee: number;
  prizePool: number;
  firstPrize: number; // For Booyah
  secondPrize?: number;
  thirdPrize?: number;
  perKillReward: number; // For Kill matches
  maxSlots: number;
  registeredCount: number;
  matchDate: string; // e.g. "Nov 8, 2026"
  matchTime: string; // e.g. "07:30 PM"
  status: MatchStatus;
  roomId?: string;
  roomPassword?: string;
  roomReleaseTime?: string;
  rules: string[];
  description: string;
  createdAt: string;
}

export interface MatchRegistration {
  id: string;
  matchId: string;
  userId: string;
  ign: string;
  ffUid: string;
  teamId?: string;
  teammateUids?: string[];
  slotNumber: number;
  entryFeePaid: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  registeredAt: string;
}

export interface Team {
  id: string;
  matchId: string;
  teamName: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl: string;
  prizePool: number;
  status: 'COMING_SOON' | 'REGISTRATION_OPEN' | 'ONGOING' | 'COMPLETED';
  notifiedUserIds: string[];
  createdAt: string;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  matchId?: string;
  txHash: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  method: 'UPI' | 'GPAY' | 'PHONEPE' | 'PAYTM' | 'CARD';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: WithdrawalStatus;
  payoutTxnId?: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface BooyahRanking {
  rank: number;
  userId: string;
  ign: string;
  ffUid: string;
  prize: number;
}

export interface KillRecord {
  userId: string;
  ign: string;
  ffUid: string;
  kills: number;
  reward: number;
}

export interface MatchResult {
  id: string;
  matchId: string;
  matchType: MatchType;
  rankings?: BooyahRanking[];
  killCounts?: KillRecord[];
  verifiedBy: string;
  verifiedAt: string;
  status: 'DRAFT' | 'APPROVED';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MATCH_JOINED' | 'ROOM_DETAILS' | 'PRIZE_WON' | 'WITHDRAWAL_UPDATE' | 'ANNOUNCEMENT';
  read: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: 'MATCH_ISSUE' | 'WALLET' | 'ACCOUNT' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  adminReply?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface AppSettings {
  minWithdrawal: number;
  maxWithdrawal: number;
  supportWhatsApp: string;
  supportPhone: string;
  supportEmail: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCta: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowedLanguages: string[];
  appVersion?: string;
  minAppVersion?: string;
  apkDownloadUrl?: string;
  forceUpdate?: boolean;
  adminUpiId?: string;
  merchantName?: string;
  announcementTicker?: string;
  tdsPercentage?: number;
  minDeposit?: number;
  maxDeposit?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OPERATOR';
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  details: any;
  timestamp: string;
}

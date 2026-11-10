import fs from 'fs';
import path from 'path';
import {
  User, Match, MatchRegistration, Team, Tournament,
  Wallet, WalletTransaction, Deposit, Withdrawal,
  MatchResult, AppNotification, SupportTicket,
  AppSettings, AdminUser, AuditLog
} from '../types';

export interface DatabaseSchema {
  users: Record<string, User>;
  matches: Record<string, Match>;
  matchRegistrations: Record<string, MatchRegistration>;
  teams: Record<string, Team>;
  tournaments: Record<string, Tournament>;
  wallets: Record<string, Wallet>;
  walletTransactions: Record<string, WalletTransaction>;
  deposits: Record<string, Deposit>;
  withdrawals: Record<string, Withdrawal>;
  matchResults: Record<string, MatchResult>;
  notifications: Record<string, AppNotification>;
  supportTickets: Record<string, SupportTicket>;
  appSettings: AppSettings;
  adminUsers: Record<string, AdminUser>;
  auditLogs: AuditLog[];
}

const DB_FILE = path.join(__dirname, '..', '..', 'data_store.json');

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving: boolean = false;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.warn('Failed to parse data_store.json, initializing fresh store', err);
      }
    }
    return this.createEmptySchema();
  }

  private createEmptySchema(): DatabaseSchema {
    return {
      users: {},
      matches: {},
      matchRegistrations: {},
      teams: {},
      tournaments: {},
      wallets: {},
      walletTransactions: {},
      deposits: {},
      withdrawals: {},
      matchResults: {},
      notifications: {},
      supportTickets: {},
      appSettings: {
        minWithdrawal: 50,
        maxWithdrawal: 10000,
        supportWhatsApp: '+918949267586',
        supportPhone: '+918949267586',
        supportEmail: 'support@ffesports.in',
        bannerTitle: 'PLAY. COMPETE. WIN.',
        bannerSubtitle: 'REGISTER NOW AND SHOW YOUR SKILLS!',
        bannerCta: 'Join Tournaments',
        maintenanceMode: false,
        allowedLanguages: ['en', 'hi', 'bn']
      },
      adminUsers: {
        'admin_1': {
          id: 'admin_1',
          email: 'admin@ffesports.in',
          name: 'Tournament Director',
          role: 'SUPER_ADMIN'
        }
      },
      auditLogs: []
    };
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write DB_FILE', e);
    } finally {
      this.isSaving = false;
    }
  }

  public get db(): DatabaseSchema {
    return this.data;
  }

  public logAudit(action: string, performedBy: string, targetType: string, targetId: string, details: any) {
    const log: AuditLog = {
      id: 'AUD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      action,
      performedBy,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.db;

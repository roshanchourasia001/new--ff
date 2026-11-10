import { dbManager, db } from '../storage/db';
import { Wallet, WalletTransaction, Withdrawal, TransactionType } from '../types';

export class WalletService {
  public static getOrCreateWallet(userId: string): Wallet {
    if (!db.wallets[userId]) {
      db.wallets[userId] = {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        updatedAt: new Date().toISOString()
      };
      dbManager.save();
    }
    return db.wallets[userId];
  }

  public static creditWallet(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    matchId?: string
  ): { wallet: Wallet; transaction: WalletTransaction } {
    if (amount <= 0) {
      throw new Error('Credit amount must be greater than zero');
    }

    const wallet = this.getOrCreateWallet(userId);
    wallet.availableBalance += amount;
    if (type === 'MATCH_WINNING' || type === 'KILL_REWARD') {
      wallet.totalEarnings += amount;
    }
    wallet.updatedAt = new Date().toISOString();

    const txId = 'TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const tx: WalletTransaction = {
      id: txId,
      userId,
      type,
      amount,
      status: 'SUCCESS',
      description,
      matchId,
      txHash: '0x' + Math.random().toString(16).substring(2, 10).toUpperCase(),
      createdAt: new Date().toISOString()
    };

    db.walletTransactions[txId] = tx;
    dbManager.save();

    return { wallet, transaction: tx };
  }

  public static debitWallet(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    matchId?: string
  ): { wallet: Wallet; transaction: WalletTransaction } {
    if (amount <= 0) {
      throw new Error('Debit amount must be greater than zero');
    }

    const wallet = this.getOrCreateWallet(userId);
    if (wallet.availableBalance < amount) {
      throw new Error(`Insufficient wallet balance. Available: ₹${wallet.availableBalance}, Required: ₹${amount}`);
    }

    wallet.availableBalance -= amount;
    wallet.updatedAt = new Date().toISOString();

    const txId = 'TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const tx: WalletTransaction = {
      id: txId,
      userId,
      type,
      amount,
      status: 'SUCCESS',
      description,
      matchId,
      txHash: '0x' + Math.random().toString(16).substring(2, 10).toUpperCase(),
      createdAt: new Date().toISOString()
    };

    db.walletTransactions[txId] = tx;
    dbManager.save();

    return { wallet, transaction: tx };
  }

  public static reserveWithdrawal(
    userId: string,
    amount: number,
    upiId: string
  ): { withdrawal: Withdrawal; wallet: Wallet } {
    const min = db.appSettings.minWithdrawal || 50;
    const max = db.appSettings.maxWithdrawal || 10000;

    if (amount < min) {
      throw new Error(`Minimum withdrawal amount is ₹${min}`);
    }
    if (amount > max) {
      throw new Error(`Maximum withdrawal per request is ₹${max}`);
    }

    // Validate UPI format (e.g. name@upi, user@okaxis, etc.)
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/;
    if (!upiRegex.test(upiId.trim())) {
      throw new Error('Invalid UPI ID format. Example: name@okhdfcbank or 9876543210@paytm');
    }

    const wallet = this.getOrCreateWallet(userId);
    if (wallet.availableBalance < amount) {
      throw new Error(`Insufficient available balance (₹${wallet.availableBalance}) to withdraw ₹${amount}`);
    }

    // Deduct from available and add to pending
    wallet.availableBalance -= amount;
    wallet.pendingBalance += amount;
    wallet.updatedAt = new Date().toISOString();

    const withdrawalId = 'WTH_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const withdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      amount,
      upiId: upiId.trim(),
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    db.withdrawals[withdrawalId] = withdrawal;
    dbManager.save();

    dbManager.logAudit('WITHDRAWAL_REQUESTED', userId, 'withdrawal', withdrawalId, { amount, upiId });

    return { withdrawal, wallet };
  }

  public static settleWithdrawal(
    withdrawalId: string,
    approve: boolean,
    adminId: string,
    payoutTxnId?: string,
    reason?: string
  ): { withdrawal: Withdrawal; refundTxn?: WalletTransaction } {
    const withdrawal = db.withdrawals[withdrawalId];
    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }
    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
      throw new Error(`Withdrawal is already in ${withdrawal.status} status`);
    }

    const wallet = this.getOrCreateWallet(withdrawal.userId);

    if (approve) {
      withdrawal.status = 'SUCCESSFUL';
      withdrawal.payoutTxnId = payoutTxnId || ('UPI_' + Date.now());
      withdrawal.processedAt = new Date().toISOString();

      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
      wallet.totalWithdrawals += withdrawal.amount;
      wallet.updatedAt = new Date().toISOString();

      // Record transaction
      const txId = 'TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
      const tx: WalletTransaction = {
        id: txId,
        userId: withdrawal.userId,
        type: 'WITHDRAWAL',
        amount: withdrawal.amount,
        status: 'SUCCESS',
        description: `Withdrawal via UPI (${withdrawal.upiId})`,
        txHash: withdrawal.payoutTxnId,
        createdAt: new Date().toISOString()
      };
      db.walletTransactions[txId] = tx;

      dbManager.logAudit('WITHDRAWAL_APPROVED', adminId, 'withdrawal', withdrawalId, {
        payoutTxnId: withdrawal.payoutTxnId,
        amount: withdrawal.amount
      });

      dbManager.save();
      return { withdrawal };
    } else {
      // Reject and refund
      withdrawal.status = 'REJECTED';
      withdrawal.failureReason = reason || 'Rejected by administrator';
      withdrawal.processedAt = new Date().toISOString();

      // Return reserved money to available balance
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - withdrawal.amount);
      wallet.availableBalance += withdrawal.amount;
      wallet.updatedAt = new Date().toISOString();

      // Create refund transaction record
      const txId = 'TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
      const refundTx: WalletTransaction = {
        id: txId,
        userId: withdrawal.userId,
        type: 'REFUND',
        amount: withdrawal.amount,
        status: 'SUCCESS',
        description: `Withdrawal refunded: ${withdrawal.failureReason}`,
        txHash: '0x' + Math.random().toString(16).substring(2, 10).toUpperCase(),
        createdAt: new Date().toISOString()
      };
      db.walletTransactions[txId] = refundTx;

      dbManager.logAudit('WITHDRAWAL_REJECTED', adminId, 'withdrawal', withdrawalId, {
        reason: withdrawal.failureReason,
        refundedAmount: withdrawal.amount
      });

      dbManager.save();
      return { withdrawal, refundTxn: refundTx };
    }
  }

  public static getTransactions(userId: string, filter?: string): WalletTransaction[] {
    const list = Object.values(db.walletTransactions).filter(t => t.userId === userId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!filter || filter === 'ALL') return list;
    if (filter === 'WINNINGS') {
      return list.filter(t => t.type === 'MATCH_WINNING' || t.type === 'KILL_REWARD');
    }
    if (filter === 'WITHDRAWALS') {
      return list.filter(t => t.type === 'WITHDRAWAL');
    }
    if (filter === 'DEPOSITS') {
      return list.filter(t => t.type === 'DEPOSIT');
    }
    return list;
  }
}

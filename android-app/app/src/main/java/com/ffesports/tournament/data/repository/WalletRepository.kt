package com.ffesports.tournament.data.repository

import com.ffesports.tournament.data.model.Wallet
import com.ffesports.tournament.data.model.WalletTransaction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class WalletRepository {
    private val _wallet = MutableStateFlow(
        Wallet(
            userId = "user_roshan",
            availableBalance = 450,
            pendingBalance = 0,
            totalEarnings = 1250,
            totalWithdrawals = 800
        )
    )
    val wallet: Flow<Wallet> = _wallet.asStateFlow()

    private val _transactions = MutableStateFlow(
        listOf(
            WalletTransaction(
                id = "TXN12345",
                userId = "user_roshan",
                type = "MATCH_WINNING",
                amount = 500,
                status = "SUCCESS",
                description = "Match Winnings - Bermuda Battle",
                matchId = "match_1",
                txHash = "0x8FA43E",
                createdAt = "Nov 8, 07:50 PM"
            ),
            WalletTransaction(
                id = "TXN12344",
                userId = "user_roshan",
                type = "ENTRY_FEE",
                amount = 20,
                status = "SUCCESS",
                description = "Match Registration - Duo Showdown",
                matchId = "match_2",
                txHash = "0x99BB21",
                createdAt = "Nov 7, 05:20 PM"
            ),
            WalletTransaction(
                id = "TXN12343",
                userId = "user_roshan",
                type = "WITHDRAWAL",
                amount = 800,
                status = "SUCCESS",
                description = "Withdrawal Request - UPI Payment",
                txHash = "UPI_983726194",
                createdAt = "Nov 5, 09:15 PM"
            ),
            WalletTransaction(
                id = "TXN12342",
                userId = "user_roshan",
                type = "MATCH_WINNING",
                amount = 350,
                status = "SUCCESS",
                description = "Match Winnings - Kalahari Fight",
                matchId = "match_2",
                txHash = "0x43EEA1",
                createdAt = "Nov 3, 06:12 PM"
            )
        )
    )
    val transactions: Flow<List<WalletTransaction>> = _transactions.asStateFlow()

    fun addMoney(amount: Int): Boolean {
        if (amount <= 0) return false
        val current = _wallet.value
        _wallet.value = current.copy(availableBalance = current.availableBalance + amount)
        val newTx = WalletTransaction(
            id = "TXN" + System.currentTimeMillis().toString().takeLast(5),
            userId = current.userId,
            type = "DEPOSIT",
            amount = amount,
            status = "SUCCESS",
            description = "Deposit via UPI",
            txHash = "0x" + System.currentTimeMillis().toString(16).takeLast(6).uppercase(),
            createdAt = "Just now"
        )
        _transactions.value = listOf(newTx) + _transactions.value
        return true
    }

    fun withdraw(amount: Int, upiId: String): Boolean {
        val current = _wallet.value
        if (amount <= 0 || current.availableBalance < amount) return false
        _wallet.value = current.copy(
            availableBalance = current.availableBalance - amount,
            pendingBalance = current.pendingBalance + amount
        )
        val newTx = WalletTransaction(
            id = "TXN" + System.currentTimeMillis().toString().takeLast(5),
            userId = current.userId,
            type = "WITHDRAWAL",
            amount = amount,
            status = "PENDING",
            description = "Withdrawal to $upiId",
            txHash = "UPI_" + System.currentTimeMillis().toString().takeLast(6),
            createdAt = "Just now"
        )
        _transactions.value = listOf(newTx) + _transactions.value
        return true
    }

    fun deductEntryFee(amount: Int, matchTitle: String): Boolean {
        val current = _wallet.value
        if (current.availableBalance < amount) return false
        _wallet.value = current.copy(availableBalance = current.availableBalance - amount)
        val newTx = WalletTransaction(
            id = "TXN" + System.currentTimeMillis().toString().takeLast(5),
            userId = current.userId,
            type = "ENTRY_FEE",
            amount = amount,
            status = "SUCCESS",
            description = "Match Registration - $matchTitle",
            txHash = "0x" + System.currentTimeMillis().toString(16).takeLast(6).uppercase(),
            createdAt = "Just now"
        )
        _transactions.value = listOf(newTx) + _transactions.value
        return true
    }
}

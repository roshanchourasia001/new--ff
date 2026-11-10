package com.ffesports.tournament.data.model

data class Wallet(
    val userId: String,
    val availableBalance: Int,
    val pendingBalance: Int,
    val totalEarnings: Int,
    val totalWithdrawals: Int
)

data class WalletTransaction(
    val id: String,
    val userId: String,
    val type: String, // DEPOSIT, ENTRY_FEE, MATCH_WINNING, KILL_REWARD, WITHDRAWAL, REFUND
    val amount: Int,
    val status: String,
    val description: String,
    val matchId: String? = null,
    val txHash: String,
    val createdAt: String
) {
    val isCredit: Boolean get() = type in listOf("DEPOSIT", "MATCH_WINNING", "KILL_REWARD", "REFUND")
}

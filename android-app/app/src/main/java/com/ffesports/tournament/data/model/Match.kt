package com.ffesports.tournament.data.model

data class Match(
    val id: String,
    val title: String,
    val category: String, // BATTLE_ROYALE or CLASH_SQUAD
    val mode: String, // SOLO, DUO, SQUAD, 1V1, 2V2, 4V4
    val matchType: String, // BOOYAH or KILL
    val map: String, // Bermuda, Kalahari, Purgatory, Alpine, Solara
    val bannerUrl: String,
    val entryFee: Int,
    val prizePool: Int,
    val firstPrize: Int,
    val secondPrize: Int = 0,
    val thirdPrize: Int = 0,
    val perKillReward: Int = 0,
    val maxSlots: Int,
    val registeredCount: Int,
    val matchDate: String,
    val matchTime: String,
    val status: String, // UPCOMING, LIVE, COMPLETED, CANCELLED
    val roomId: String? = null,
    val roomPassword: String? = null,
    val rules: List<String> = emptyList(),
    val description: String = ""
) {
    val spotsLeft: Int get() = maxOf(0, maxSlots - registeredCount)
    val progressPercent: Float get() = if (maxSlots > 0) registeredCount.toFloat() / maxSlots.toFloat() else 0f
    val isFull: Boolean get() = registeredCount >= maxSlots
}

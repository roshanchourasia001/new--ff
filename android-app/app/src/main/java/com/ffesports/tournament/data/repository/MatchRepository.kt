package com.ffesports.tournament.data.repository

import com.ffesports.tournament.data.model.Match
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MatchRepository {
    private val _matches = MutableStateFlow<List<Match>>(emptyList())
    val matches: Flow<List<Match>> = _matches.asStateFlow()

    private val _registeredMatchIds = MutableStateFlow<Set<String>>(setOf("match_1"))
    val registeredMatchIds: Flow<Set<String>> = _registeredMatchIds.asStateFlow()

    init {
        // Default local / seeded state matching the primary reference showcase
        _matches.value = listOf(
            Match(
                id = "match_1",
                title = "Bermuda Solo Battle",
                category = "BATTLE_ROYALE",
                mode = "SOLO",
                matchType = "BOOYAH",
                map = "Bermuda",
                bannerUrl = "/shared-assets/bermuda.jpg",
                entryFee = 20,
                prizePool = 500,
                firstPrize = 300,
                secondPrize = 150,
                thirdPrize = 50,
                maxSlots = 48,
                registeredCount = 32,
                matchDate = "Nov 8, 2026",
                matchTime = "07:30 PM",
                status = "UPCOMING",
                roomId = "8920194",
                roomPassword = "990",
                rules = listOf(
                    "Strictly mobile devices only (No PC/Emulators)",
                    "Teaming up in Solo matches leads to immediate ban",
                    "Room ID & Password available 15 minutes prior",
                    "Take screenshot of final kill/rank screen for verification"
                ),
                description = "Fight for glory in Bermuda! Show your skills and win big rewards."
            ),
            Match(
                id = "match_2",
                title = "Duo Showdown",
                category = "BATTLE_ROYALE",
                mode = "DUO",
                matchType = "BOOYAH",
                map = "Kalahari",
                bannerUrl = "/shared-assets/kalahari.jpg",
                entryFee = 30,
                prizePool = 800,
                firstPrize = 500,
                secondPrize = 200,
                thirdPrize = 100,
                maxSlots = 48,
                registeredCount = 24,
                matchDate = "Nov 8, 2026",
                matchTime = "08:30 PM",
                status = "UPCOMING",
                rules = listOf(
                    "Both duo partners must be registered",
                    "Mic communication enabled",
                    "Prizes split equally between teammates"
                ),
                description = "Team up with your duo partner and dominate the Kalahari desert!"
            ),
            Match(
                id = "match_3",
                title = "Purgatory Kill Rush",
                category = "BATTLE_ROYALE",
                mode = "SOLO",
                matchType = "KILL",
                map = "Purgatory",
                bannerUrl = "/shared-assets/purgatory.jpg",
                entryFee = 30,
                prizePool = 1440,
                firstPrize = 0,
                perKillReward = 30,
                maxSlots = 48,
                registeredCount = 18,
                matchDate = "Nov 9, 2026",
                matchTime = "06:00 PM",
                status = "UPCOMING",
                rules = listOf(
                    "Every verified kill earns ₹30 directly into your wallet",
                    "No rank placement requirements - pure kills!"
                ),
                description = "Pure aggression! Secure kills and win ₹30 for every kill you get!"
            ),
            Match(
                id = "match_4",
                title = "Alpine Clash Squad 4v4",
                category = "CLASH_SQUAD",
                mode = "4V4",
                matchType = "BOOYAH",
                map = "Alpine",
                bannerUrl = "/shared-assets/solara.jpg",
                entryFee = 40,
                prizePool = 600,
                firstPrize = 400,
                secondPrize = 200,
                maxSlots = 8,
                registeredCount = 6,
                matchDate = "Nov 9, 2026",
                matchTime = "09:00 PM",
                status = "UPCOMING",
                rules = listOf("Standard CS Competitive Rules", "Best of 7 rounds"),
                description = "Tactical 4v4 Clash Squad combat. The ultimate squad showdown."
            )
        )
    }

    fun registerForMatch(matchId: String): Boolean {
        val currentMatches = _matches.value.toMutableList()
        val index = currentMatches.indexOfFirst { it.id == matchId }
        if (index != -1) {
            val match = currentMatches[index]
            if (match.registeredCount < match.maxSlots) {
                currentMatches[index] = match.copy(registeredCount = match.registeredCount + 1)
                _matches.value = currentMatches
                _registeredMatchIds.value = _registeredMatchIds.value + matchId
                return true
            }
        }
        return false
    }

    fun getMatchById(matchId: String): Match? {
        return _matches.value.find { it.id == matchId }
    }
}

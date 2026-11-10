package com.ffesports.tournament.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ffesports.tournament.data.model.Match
import com.ffesports.tournament.ui.components.*
import com.ffesports.tournament.ui.theme.*

@Composable
fun HomeScreen(
    playerName: String,
    walletBalance: Int,
    matches: List<Match>,
    registeredMatchIds: Set<String>,
    onMatchClick: (Match) -> Unit,
    onJoinClick: (Match) -> Unit,
    onWalletClick: () -> Unit,
    onNotificationClick: () -> Unit,
    onMyMatchesTabSelected: () -> Unit
) {
    var homeSubTab by remember { mutableStateOf("ALL") } // ALL or MY
    var selectedFilter by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }
    var showFilterModal by remember { mutableStateOf(false) }

    val filteredMatches = remember(matches, selectedFilter, searchQuery, homeSubTab, registeredMatchIds) {
        var list = matches

        if (homeSubTab == "MY") {
            list = list.filter { registeredMatchIds.contains(it.id) }
        }

        if (selectedFilter != "All") {
            list = when (selectedFilter) {
                "Solo", "Duo", "Squad" -> list.filter { it.mode.equals(selectedFilter, ignoreCase = true) }
                "Booyah" -> list.filter { it.matchType.equals("BOOYAH", ignoreCase = true) }
                "Kill" -> list.filter { it.matchType.equals("KILL", ignoreCase = true) }
                else -> list
            }
        }

        if (searchQuery.isNotBlank()) {
            val q = searchQuery.lowercase()
            list = list.filter {
                it.title.lowercase().contains(q) ||
                it.map.lowercase().contains(q) ||
                it.mode.lowercase().contains(q)
            }
        }

        list
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
    ) {
        // 1. Header Bar
        HeaderBar(
            playerName = playerName,
            walletBalance = walletBalance,
            onWalletClick = onWalletClick,
            onNotificationClick = onNotificationClick
        )

        // 2. Match Navigation Tabs: [ ALL MATCHES ] [ MY MATCHES ]
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (homeSubTab == "ALL") PrimaryBlue else SecondaryBackground)
                    .clickable { homeSubTab = "ALL" },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "ALL MATCHES",
                    color = if (homeSubTab == "ALL") Color.White else SecondaryText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (homeSubTab == "MY") PrimaryBlue else SecondaryBackground)
                    .clickable { homeSubTab = "MY" },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "MY MATCHES",
                    color = if (homeSubTab == "MY") Color.White else SecondaryText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }

        // 3. Scrollable Match Feed
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Promotional Banner
            if (homeSubTab == "ALL") {
                item {
                    PromotionalBanner()
                }
            }

            // Filter Chips & Search Bar
            item {
                FilterBar(
                    selectedFilter = selectedFilter,
                    onFilterSelected = { selectedFilter = it },
                    searchQuery = searchQuery,
                    onSearchChanged = { searchQuery = it },
                    onOpenFilterModal = { showFilterModal = true }
                )
            }

            // Match Cards
            if (filteredMatches.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (homeSubTab == "MY") "You haven't joined any matches yet." else "No matches found matching criteria.",
                            color = SecondaryText,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                items(filteredMatches) { match ->
                    val isRegistered = registeredMatchIds.contains(match.id)
                    MatchCard(
                        match = match,
                        isRegistered = isRegistered,
                        onCardClick = { onMatchClick(match) },
                        onJoinClick = { onJoinClick(match) }
                    )
                }
            }
        }
    }
}

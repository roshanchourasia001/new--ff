package com.ffesports.tournament

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.ffesports.tournament.data.model.Match
import com.ffesports.tournament.ui.components.AppBottomNavigation
import com.ffesports.tournament.ui.components.NavTab
import com.ffesports.tournament.ui.screens.*
import com.ffesports.tournament.ui.theme.BackgroundWhite
import com.ffesports.tournament.ui.theme.FFEsportsTheme
import com.ffesports.tournament.viewmodel.MainViewModel

enum class ScreenState {
    LOGIN,
    MAIN_TABS,
    MATCH_DETAILS,
    MATCH_JOINED_SUCCESS,
    ADD_MONEY,
    WITHDRAW,
    TRANSACTION_HISTORY,
    SUPPORT
}

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            FFEsportsTheme {
                val matches by viewModel.matches.collectAsState()
                val registeredMatchIds by viewModel.registeredMatchIds.collectAsState()
                val wallet by viewModel.wallet.collectAsState()
                val transactions by viewModel.transactions.collectAsState()
                val currentUser by viewModel.currentUser.collectAsState()

                var currentScreen by remember { mutableStateOf(ScreenState.MAIN_TABS) }
                var currentTab by remember { mutableStateOf(NavTab.MATCHES) }
                var selectedMatch by remember { mutableStateOf<Match?>(null) }
                var lastJoinedMatchTitle by remember { mutableStateOf("") }

                val copyToClipboard: (String, String) -> Unit = { label, text ->
                    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText(label, text)
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(this, "Copied $label: $text", Toast.LENGTH_SHORT).show()
                }

                when (currentScreen) {
                    ScreenState.LOGIN -> {
                        LoginScreen(
                            onGoogleSignInClick = {
                                Toast.makeText(this, "Logged in as ${currentUser.name}", Toast.LENGTH_SHORT).show()
                                currentScreen = ScreenState.MAIN_TABS
                            }
                        )
                    }

                    ScreenState.MATCH_DETAILS -> {
                        selectedMatch?.let { match ->
                            MatchDetailsScreen(
                                match = match,
                                isRegistered = registeredMatchIds.contains(match.id),
                                onBackClick = { currentScreen = ScreenState.MAIN_TABS },
                                onJoinClick = {
                                    val success = viewModel.joinMatch(match)
                                    if (success) {
                                        lastJoinedMatchTitle = match.title
                                        currentScreen = ScreenState.MATCH_JOINED_SUCCESS
                                    } else {
                                        Toast.makeText(this, "Insufficient balance! Please add money to wallet.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            )
                        } ?: run {
                            currentScreen = ScreenState.MAIN_TABS
                        }
                    }

                    ScreenState.MATCH_JOINED_SUCCESS -> {
                        MatchJoinedSuccessScreen(
                            matchTitle = lastJoinedMatchTitle,
                            onViewMyMatches = {
                                currentTab = NavTab.MATCHES
                                currentScreen = ScreenState.MAIN_TABS
                            },
                            onBackToHome = {
                                currentScreen = ScreenState.MAIN_TABS
                            }
                        )
                    }

                    ScreenState.ADD_MONEY -> {
                        AddMoneyScreen(
                            currentBalance = wallet.availableBalance,
                            onBackClick = { currentScreen = ScreenState.MAIN_TABS },
                            onConfirmAddMoney = { amount, method ->
                                viewModel.addMoney(amount)
                                Toast.makeText(this, "₹$amount added via $method!", Toast.LENGTH_SHORT).show()
                                currentScreen = ScreenState.MAIN_TABS
                            }
                        )
                    }

                    ScreenState.WITHDRAW -> {
                        WithdrawScreen(
                            availableBalance = wallet.availableBalance,
                            onBackClick = { currentScreen = ScreenState.MAIN_TABS },
                            onConfirmWithdraw = { amount, upiId ->
                                val success = viewModel.withdraw(amount, upiId)
                                if (success) {
                                    Toast.makeText(this, "Withdrawal request of ₹$amount to $upiId submitted!", Toast.LENGTH_LONG).show()
                                    currentScreen = ScreenState.MAIN_TABS
                                } else {
                                    Toast.makeText(this, "Insufficient available balance!", Toast.LENGTH_SHORT).show()
                                }
                            }
                        )
                    }

                    ScreenState.TRANSACTION_HISTORY -> {
                        TransactionHistoryScreen(
                            transactions = transactions,
                            onBackClick = { currentScreen = ScreenState.MAIN_TABS }
                        )
                    }

                    ScreenState.SUPPORT -> {
                        SupportScreen(
                            onBackClick = { currentScreen = ScreenState.MAIN_TABS },
                            onContactSupportClick = {
                                copyToClipboard("WhatsApp Support", "+918949267586")
                            }
                        )
                    }

                    ScreenState.MAIN_TABS -> {
                        Scaffold(
                            bottomBar = {
                                AppBottomNavigation(
                                    currentTab = currentTab,
                                    onTabSelected = { currentTab = it }
                                )
                            }
                        ) { paddingValues ->
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(paddingValues)
                                    .background(BackgroundWhite)
                            ) {
                                when (currentTab) {
                                    NavTab.MATCHES -> {
                                        HomeScreen(
                                            playerName = currentUser.ign.ifEmpty { "Player" },
                                            walletBalance = wallet.availableBalance,
                                            matches = matches,
                                            registeredMatchIds = registeredMatchIds,
                                            onMatchClick = { match ->
                                                selectedMatch = match
                                                currentScreen = ScreenState.MATCH_DETAILS
                                            },
                                            onJoinClick = { match ->
                                                val success = viewModel.joinMatch(match)
                                                if (success) {
                                                    lastJoinedMatchTitle = match.title
                                                    currentScreen = ScreenState.MATCH_JOINED_SUCCESS
                                                } else {
                                                    Toast.makeText(this@MainActivity, "Insufficient balance! Please add money.", Toast.LENGTH_LONG).show()
                                                }
                                            },
                                            onWalletClick = { currentTab = NavTab.WALLET },
                                            onNotificationClick = {
                                                Toast.makeText(this@MainActivity, "All caught up! No unread notifications.", Toast.LENGTH_SHORT).show()
                                            },
                                            onMyMatchesTabSelected = {
                                                // handled within HomeScreen subtabs
                                            }
                                        )
                                    }

                                    NavTab.TOURNAMENTS -> {
                                        TournamentsScreen(
                                            onNotifyClick = {
                                                Toast.makeText(this@MainActivity, "You'll be notified when registration opens!", Toast.LENGTH_SHORT).show()
                                            }
                                        )
                                    }

                                    NavTab.WALLET -> {
                                        WalletScreen(
                                            wallet = wallet,
                                            transactions = transactions,
                                            onAddMoneyClick = { currentScreen = ScreenState.ADD_MONEY },
                                            onWithdrawClick = { currentScreen = ScreenState.WITHDRAW },
                                            onSeeAllTransactions = { currentScreen = ScreenState.TRANSACTION_HISTORY }
                                        )
                                    }

                                    NavTab.PROFILE -> {
                                        ProfileScreen(
                                            user = currentUser,
                                            onEditProfileClick = {
                                                Toast.makeText(this@MainActivity, "Profile is verified and up-to-date", Toast.LENGTH_SHORT).show()
                                            },
                                            onSupportClick = { currentScreen = ScreenState.SUPPORT },
                                            onLanguageClick = {
                                                Toast.makeText(this@MainActivity, "Language set to English (Default)", Toast.LENGTH_SHORT).show()
                                            },
                                            onLogoutClick = {
                                                currentScreen = ScreenState.LOGIN
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

package com.ffesports.tournament.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ffesports.tournament.data.model.*
import com.ffesports.tournament.data.repository.MatchRepository
import com.ffesports.tournament.data.repository.UserRepository
import com.ffesports.tournament.data.repository.WalletRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(
    private val matchRepo: MatchRepository = MatchRepository(),
    private val walletRepo: WalletRepository = WalletRepository(),
    private val userRepo: UserRepository = UserRepository()
) : ViewModel() {

    val matches: StateFlow<List<Match>> = matchRepo.matches
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val registeredMatchIds: StateFlow<Set<String>> = matchRepo.registeredMatchIds
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), setOf("match_1"))

    val wallet: StateFlow<Wallet> = walletRepo.wallet
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), Wallet("user_roshan", 450, 0, 1250, 800))

    val transactions: StateFlow<List<WalletTransaction>> = walletRepo.transactions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentUser: StateFlow<User> = userRepo.currentUser
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), User("user_roshan", "Roshan Chourasia", "Roshan", "FF123456", "roshan@ffesports.in", "8949267586", 21, "Male", "Uttarakhand", "India", "/shared-assets/avatar.jpg", true, false))

    fun joinMatch(match: Match): Boolean {
        val currentBalance = wallet.value.availableBalance
        if (currentBalance < match.entryFee) {
            return false
        }
        val success = matchRepo.registerForMatch(match.id)
        if (success) {
            walletRepo.deductEntryFee(match.entryFee, match.title)
        }
        return success
    }

    fun addMoney(amount: Int): Boolean {
        return walletRepo.addMoney(amount)
    }

    fun withdraw(amount: Int, upiId: String): Boolean {
        return walletRepo.withdraw(amount, upiId)
    }

    fun updateProfile(name: String, ign: String, ffUid: String, age: Int, gender: String, state: String, country: String, phone: String) {
        userRepo.updateProfile(name, ign, ffUid, age, gender, state, country, phone)
    }
}

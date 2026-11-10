package com.ffesports.tournament.data.repository

import com.ffesports.tournament.data.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class UserRepository {
    private val _currentUser = MutableStateFlow(
        User(
            id = "user_roshan",
            name = "Roshan Chourasia",
            ign = "Roshan",
            ffUid = "FF123456",
            email = "roshan@ffesports.in",
            phone = "8949267586",
            age = 21,
            gender = "Male",
            state = "Uttarakhand",
            country = "India",
            avatarUrl = "/shared-assets/avatar.jpg",
            isProfileComplete = true,
            isBanned = false
        )
    )
    val currentUser: Flow<User> = _currentUser.asStateFlow()

    fun updateProfile(
        name: String,
        ign: String,
        ffUid: String,
        age: Int,
        gender: String,
        state: String,
        country: String,
        phone: String
    ) {
        _currentUser.value = _currentUser.value.copy(
            name = name,
            ign = ign,
            ffUid = ffUid,
            age = age,
            gender = gender,
            state = state,
            country = country,
            phone = phone,
            isProfileComplete = ign.isNotBlank() && ffUid.isNotBlank()
        )
    }
}

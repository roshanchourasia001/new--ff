package com.ffesports.tournament.data.model

data class User(
    val id: String,
    val name: String,
    val ign: String, // In-Game Name
    val ffUid: String, // Free Fire UID
    val email: String,
    val phone: String,
    val age: Int,
    val gender: String,
    val state: String,
    val country: String,
    val avatarUrl: String,
    val isProfileComplete: Boolean,
    val isBanned: Boolean
)

package com.ffesports.tournament.data.model

data class Tournament(
    val id: String,
    val title: String,
    val subtitle: String,
    val description: String,
    val bannerUrl: String,
    val prizePool: Int,
    val status: String
)

data class NotificationItem(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: String,
    val read: Boolean,
    val createdAt: String
)

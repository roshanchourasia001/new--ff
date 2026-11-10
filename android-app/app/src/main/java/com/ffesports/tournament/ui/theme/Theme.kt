package com.ffesports.tournament.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    secondary = SecondaryBlue,
    tertiary = LightBlue,
    background = BackgroundWhite,
    surface = CardBackground,
    onPrimary = BackgroundWhite,
    onSecondary = BackgroundWhite,
    onBackground = PrimaryText,
    onSurface = PrimaryText
)

@Composable
fun FFEsportsTheme(
    darkTheme: Boolean = false, // Strictly light theme per Part 1
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}

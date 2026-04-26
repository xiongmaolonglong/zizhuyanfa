package com.banghe.measure.core.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = PrimaryLight,
    secondary = Info,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = TextSecondary,
    background = Background,
    onBackground = TextPrimary,
    error = Error,
    onError = androidx.compose.ui.graphics.Color.White,
    outline = Border
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = androidx.compose.ui.graphics.Color.Black,
    primaryContainer = PrimaryDark,
    secondary = Info,
    onSecondary = androidx.compose.ui.graphics.Color.Black,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkTextSecondary,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    error = Error,
    onError = androidx.compose.ui.graphics.Color.Black,
    outline = DarkBorder
)

@Composable
fun MeasureTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}

package com.ffesports.tournament.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ffesports.tournament.data.model.User
import com.ffesports.tournament.ui.theme.*

@Composable
fun ProfileScreen(
    user: User,
    onEditProfileClick: () -> Unit,
    onSupportClick: () -> Unit,
    onLanguageClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
            .verticalScroll(rememberScrollState())
    ) {
        // App Bar
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White,
            tonalElevation = 2.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Profile",
                    color = PrimaryText,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )

                IconButton(onClick = onEditProfileClick, modifier = Modifier.size(24.dp)) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        tint = PrimaryText
                    )
                }
            }
        }

        // 1. User Header Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(contentAlignment = Alignment.BottomEnd) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(PrimaryBlue),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = user.name.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 32.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .clip(CircleShape)
                        .background(PrimaryBlue)
                        .border(2.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Change Photo",
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = user.name,
                color = PrimaryText,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "FF UID: ${user.ffUid}  •  IGN: ${user.ign}",
                color = SecondaryText,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Edit Profile Button
            Button(
                onClick = onEditProfileClick,
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                modifier = Modifier.height(36.dp)
            ) {
                Text(
                    text = "Edit Profile",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // 2. Personal Information Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = CardBackground)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                ProfileInfoRow(icon = Icons.Default.Cake, label = "Age", value = "${user.age} Years")
                Divider(color = BorderColor, modifier = Modifier.padding(vertical = 10.dp))
                ProfileInfoRow(icon = Icons.Default.Person, label = "Gender", value = user.gender)
                Divider(color = BorderColor, modifier = Modifier.padding(vertical = 10.dp))
                ProfileInfoRow(icon = Icons.Default.LocationOn, label = "State", value = user.state)
                Divider(color = BorderColor, modifier = Modifier.padding(vertical = 10.dp))
                ProfileInfoRow(icon = Icons.Default.Public, label = "Country", value = user.country)
                Divider(color = BorderColor, modifier = Modifier.padding(vertical = 10.dp))
                ProfileInfoRow(icon = Icons.Default.Phone, label = "Mobile", value = "+91 ${user.phone}")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 3. Menu Navigation Options
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = CardBackground)
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                ProfileMenuItem(
                    icon = Icons.Default.Headphones,
                    label = "Support Team",
                    onClick = onSupportClick
                )
                Divider(color = BorderColor)
                ProfileMenuItem(
                    icon = Icons.Default.HelpOutline,
                    label = "Help Desk & FAQ",
                    onClick = onSupportClick
                )
                Divider(color = BorderColor)
                ProfileMenuItem(
                    icon = Icons.Default.Translate,
                    label = "Language Settings",
                    onClick = onLanguageClick
                )
                Divider(color = BorderColor)
                ProfileMenuItem(
                    icon = Icons.Default.Security,
                    label = "Privacy Policy",
                    onClick = {}
                )
                Divider(color = BorderColor)
                ProfileMenuItem(
                    icon = Icons.Default.Info,
                    label = "About FF Esports",
                    onClick = {}
                )
                Divider(color = BorderColor)
                ProfileMenuItem(
                    icon = Icons.Default.ExitToApp,
                    label = "Logout",
                    iconColor = ErrorRed,
                    labelColor = ErrorRed,
                    onClick = onLogoutClick
                )
            }
        }

        Spacer(modifier = Modifier.height(30.dp))
    }
}

@Composable
fun ProfileInfoRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = SecondaryText,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = label,
                color = SecondaryText,
                fontSize = 13.sp
            )
        }
        Text(
            text = value,
            color = PrimaryText,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    label: String,
    iconColor: Color = PrimaryBlue,
    labelColor: Color = PrimaryText,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = label,
                color = labelColor,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = SecondaryText,
            modifier = Modifier.size(18.dp)
        )
    }
}

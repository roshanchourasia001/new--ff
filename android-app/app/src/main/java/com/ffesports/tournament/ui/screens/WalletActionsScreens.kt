package com.ffesports.tournament.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ffesports.tournament.ui.theme.*

@Composable
fun AddMoneyScreen(
    currentBalance: Int,
    onBackClick: () -> Unit,
    onConfirmAddMoney: (Int, String) -> Unit
) {
    var amountText by remember { mutableStateOf("100") }
    var selectedMethod by remember { mutableStateOf("Google Pay") }
    val suggestedAmounts = listOf(50, 100, 200, 500)
    val paymentMethods = listOf("Google Pay", "PhonePe", "Paytm UPI", "BHIM UPI")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White,
            tonalElevation = 2.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryText)
                }
                Text(text = "Add Money to Wallet", color = PrimaryText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }

        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(20.dp)) {
            Text(text = "Enter Amount (₹)", color = SecondaryText, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it.filter { char -> char.isDigit() } },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                prefix = { Text("₹ ", fontWeight = FontWeight.Bold, color = PrimaryText) }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Quick Amount Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                suggestedAmounts.forEach { amt ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(SecondaryBackground)
                            .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                            .clickable { amountText = amt.toString() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "+₹$amt", color = PrimaryBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(text = "Select Payment Method", color = PrimaryText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(10.dp))

            paymentMethods.forEach { method ->
                val isSelected = selectedMethod == method
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, if (isSelected) PrimaryBlue else BorderColor, RoundedCornerShape(8.dp))
                        .clickable { selectedMethod = method },
                    colors = CardDefaults.cardColors(containerColor = if (isSelected) LightBlue else CardBackground)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = method, color = PrimaryText, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        if (isSelected) {
                            Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = {
                    val amt = amountText.toIntOrNull() ?: 0
                    if (amt > 0) onConfirmAddMoney(amt, selectedMethod)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text(text = "Continue to Payment · ₹$amountText", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun WithdrawScreen(
    availableBalance: Int,
    onBackClick: () -> Unit,
    onConfirmWithdraw: (Int, String) -> Unit
) {
    var amountText by remember { mutableStateOf("") }
    var upiId by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundWhite)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White,
            tonalElevation = 2.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryText)
                }
                Text(text = "Withdraw Money", color = PrimaryText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }

        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(20.dp)) {
            // Available Balance Capsule
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(LightBlue)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Available Balance", color = PrimaryBlue, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text(text = "₹$availableBalance", color = PrimaryText, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(text = "Withdrawal Amount (Min ₹50)", color = SecondaryText, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = amountText,
                onValueChange = {
                    amountText = it.filter { char -> char.isDigit() }
                    errorMessage = ""
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                prefix = { Text("₹ ", fontWeight = FontWeight.Bold, color = PrimaryText) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(text = "UPI ID / VPA", color = SecondaryText, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = upiId,
                onValueChange = {
                    upiId = it.trim()
                    errorMessage = ""
                },
                placeholder = { Text("e.g. 9876543210@paytm or name@okhdfcbank", color = SecondaryText, fontSize = 12.sp) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            if (errorMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = errorMessage, color = ErrorRed, fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "• Payouts processed within 15-30 minutes after verification.\n• Ensure UPI ID is accurate to avoid transaction delays.",
                color = SecondaryText,
                fontSize = 11.sp,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = {
                    val amt = amountText.toIntOrNull() ?: 0
                    if (amt < 50) {
                        errorMessage = "Minimum withdrawal is ₹50"
                    } else if (amt > availableBalance) {
                        errorMessage = "Amount exceeds available balance (₹$availableBalance)"
                    } else if (!upiId.contains("@")) {
                        errorMessage = "Please enter a valid UPI ID (e.g. name@upi)"
                    } else {
                        onConfirmWithdraw(amt, upiId)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
            ) {
                Text(text = "Confirm Withdrawal", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}

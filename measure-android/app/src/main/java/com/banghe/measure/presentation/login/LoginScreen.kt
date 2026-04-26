package com.banghe.measure.presentation.login

import android.app.Activity
import android.content.res.Configuration
import android.os.Build
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.Image
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.R
import com.banghe.measure.core.theme.Error
import com.banghe.measure.core.theme.Primary
import com.banghe.measure.data.auth.AuthViewModel
import com.banghe.measure.data.auth.AuthViewModelFactory

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    authViewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory)
) {
    val authState by authViewModel.authState.collectAsState()

    LaunchedEffect(authState.isLoggedIn) {
        if (authState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    // 状态栏适配深色背景
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color(0xFF1E3A5F).toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    var loginMode by remember { mutableStateOf(LoginMode.PASSWORD) }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var smsCode by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var countdown by remember { mutableIntStateOf(0) }

    LaunchedEffect(countdown) {
        if (countdown > 0) {
            kotlinx.coroutines.delay(1000)
            countdown--
        }
    }

    // 深色背景专用颜色常量
    val white08 = Color.White.copy(alpha = 0.08f)
    val white10 = Color.White.copy(alpha = 0.10f)
    val white12 = Color.White.copy(alpha = 0.12f)
    val white15 = Color.White.copy(alpha = 0.15f)
    val white18 = Color.White.copy(alpha = 0.18f)
    val white20 = Color.White.copy(alpha = 0.20f)
    val white25 = Color.White.copy(alpha = 0.25f)
    val white30 = Color.White.copy(alpha = 0.30f)
    val white35 = Color.White.copy(alpha = 0.35f)
    val white40 = Color.White.copy(alpha = 0.40f)
    val white50 = Color.White.copy(alpha = 0.50f)
    val white60 = Color.White.copy(alpha = 0.60f)

    // 深蓝渐变背景
    val bgGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF1E3A5F),
            Color(0xFF2563EB),
            Color(0xFF60A5FA)
        )
    )

    val isLandscape = LocalConfiguration.current.orientation == Configuration.ORIENTATION_LANDSCAPE
    val logoTopPadding = if (isLandscape) 30.dp else 60.dp

    val blurSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    val cardBgColor = if (blurSupported) white12 else white18

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(bgGradient)
    ) {
        // 装饰矩形（固定位置）
        Box(
            modifier = Modifier
                .offset(x = (-30).dp, y = 40.dp)
                .size(60.dp, 90.dp)
                .rotate(-5f)
                .border(1.5.dp, white10, RoundedCornerShape(4.dp))
        )
        Box(
            modifier = Modifier
                .offset(x = 25.dp, y = (-50).dp)
                .size(45.dp, 65.dp)
                .rotate(-8f)
                .border(1.5.dp, Color.White.copy(alpha = 0.07f), RoundedCornerShape(4.dp))
        )
        Box(
            modifier = Modifier
                .offset(x = (-40).dp, y = (-80).dp)
                .size(50.dp, 35.dp)
                .rotate(12f)
                .border(1.5.dp, white08, RoundedCornerShape(4.dp))
        )
        Box(
            modifier = Modifier
                .offset(x = 40.dp, y = 120.dp)
                .size(35.dp, 50.dp)
                .rotate(-15f)
                .border(1.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(4.dp))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(logoTopPadding))

            // Logo 圆形裁剪
            Image(
                painter = painterResource(R.drawable.logo_small),
                contentDescription = "Logo",
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .border(2.dp, white20, CircleShape)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 品牌名
            Text(
                text = "邦和广告",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Text(
                text = "现场拍照申报 · 实时查看进度",
                color = white60,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 6.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // 毛玻璃卡片
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(cardBgColor, RoundedCornerShape(20.dp))
                    .border(1.dp, white18, RoundedCornerShape(20.dp))
                    .padding(horizontal = 24.dp, vertical = 24.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    // Tab 切换
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(white10, RoundedCornerShape(24.dp))
                    ) {
                        TabButton(
                            text = "密码登录",
                            selected = loginMode == LoginMode.PASSWORD,
                            selectedBgColor = white25,
                            textColor = Color.White,
                            onClick = {
                                loginMode = LoginMode.PASSWORD
                                authState.error?.let { authViewModel.clearError() }
                            },
                            modifier = Modifier.weight(1f)
                        )
                        TabButton(
                            text = "短信登录",
                            selected = loginMode == LoginMode.SMS,
                            selectedBgColor = white25,
                            textColor = Color.White,
                            onClick = {
                                loginMode = LoginMode.SMS
                                authState.error?.let { authViewModel.clearError() }
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(28.dp))

                    // 手机号输入框
                    InputField(
                        value = phone,
                        onValueChange = { raw ->
                            val digits = raw.filter { it.isDigit() }.take(11)
                            phone = digits
                        },
                        placeholder = "请输入手机号",
                        leadingIcon = Icons.Default.PhoneAndroid,
                        iconTint = white40,
                        placeholderColor = white35,
                        textColor = Color.White,
                        visualTransformation = PhoneVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    if (loginMode == LoginMode.PASSWORD) {
                        InputField(
                            value = password,
                            onValueChange = { password = it },
                            placeholder = "请输入密码",
                            leadingIcon = Icons.Default.Lock,
                            iconTint = white40,
                            placeholderColor = white35,
                            textColor = Color.White,
                            trailingIcon = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            onTrailingClick = { passwordVisible = !passwordVisible },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                        )
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            InputField(
                                value = smsCode,
                                onValueChange = { if (it.length <= 6) smsCode = it },
                                placeholder = "请输入验证码",
                                leadingIcon = Icons.Default.Sms,
                                iconTint = white40,
                                placeholderColor = white35,
                                textColor = Color.White,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(1f)
                            )
                            Button(
                                onClick = {
                                    if (phone.length == 11 && countdown == 0) {
                                        authViewModel.sendSmsCode(phone)
                                        countdown = 60
                                    }
                                },
                                enabled = countdown == 0 && phone.length == 11,
                                modifier = Modifier
                                    .height(52.dp)
                                    .width(100.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.White,
                                    disabledContainerColor = white40,
                                    contentColor = Primary,
                                    disabledContentColor = white60
                                )
                            ) {
                                Text(
                                    text = if (countdown > 0) "${countdown}s" else "发送",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    authState.error?.let { error ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = error,
                            color = Error,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // 登录按钮
                    val isLoginEnabled = !authState.isLoading && phone.length == 11 &&
                        (loginMode == LoginMode.PASSWORD && password.isNotBlank() ||
                            loginMode == LoginMode.SMS && smsCode.length >= 4)

                    Button(
                        onClick = {
                            when (loginMode) {
                                LoginMode.PASSWORD -> authViewModel.loginWithPassword(phone, password)
                                LoginMode.SMS -> authViewModel.loginWithSms(phone, smsCode)
                            }
                        },
                        enabled = isLoginEnabled,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(26.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            disabledContainerColor = white40,
                            contentColor = Primary,
                            disabledContentColor = Primary.copy(alpha = 0.5f)
                        ),
                        elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp)
                    ) {
                        if (authState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp,
                                color = Primary
                            )
                        } else {
                            Text("登 录", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // 忘记密码
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Text(
                            text = "忘记密码？",
                            color = white50,
                            fontSize = 12.sp,
                            modifier = Modifier.clickable { }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = "© 2026 邦和量尺",
                color = Color.White.copy(alpha = 0.3f),
                fontSize = 11.sp,
                modifier = Modifier.padding(bottom = 24.dp)
            )
        }
    }
}

@Composable
private fun TabButton(
    text: String,
    selected: Boolean,
    selectedBgColor: Color,
    textColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val bgColor by animateColorAsState(
        if (selected) selectedBgColor else Color.Transparent
    )
    val textAlpha by animateFloatAsState(
        if (selected) 1f else 0.6f,
        label = "textAlpha"
    )
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val pressedColor = if (isPressed && !selected) Color.White.copy(alpha = 0.08f) else bgColor

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .background(pressedColor, RoundedCornerShape(24.dp))
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor.copy(alpha = textAlpha),
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            fontSize = 14.sp
        )
    }
}

@Composable
private fun InputField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    leadingIcon: ImageVector,
    iconTint: Color = Color.White.copy(alpha = 0.4f),
    placeholderColor: Color = Color.White.copy(alpha = 0.35f),
    textColor: Color = Color.White,
    trailingIcon: ImageVector? = null,
    onTrailingClick: (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    modifier: Modifier = Modifier
) {
    var isFocused by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                if (isFocused) Color.White.copy(alpha = 0.12f) else Color.White.copy(alpha = 0.08f),
                RoundedCornerShape(12.dp)
            )
            .then(
                if (isFocused) Modifier.border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                else Modifier
            )
            .height(52.dp)
            .padding(start = 16.dp, end = 16.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(leadingIcon, null, Modifier.size(18.dp), tint = iconTint)
            Spacer(Modifier.width(12.dp))

            Box(modifier = Modifier.weight(1f)) {
                if (value.isEmpty() && !isFocused) {
                    Text(placeholder, color = placeholderColor, fontSize = 14.sp)
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    textStyle = TextStyle(fontSize = 15.sp, color = textColor),
                    singleLine = true,
                    visualTransformation = visualTransformation,
                    keyboardOptions = keyboardOptions,
                    cursorBrush = Brush.verticalGradient(listOf(Color.White, Color.White)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onFocusChanged { isFocused = it.isFocused }
                )
            }

            if (trailingIcon != null) {
                Spacer(Modifier.width(8.dp))
                Icon(
                    trailingIcon, null,
                    Modifier.size(20.dp).clickable { onTrailingClick?.invoke() },
                    tint = iconTint
                )
            }
        }
    }
}

/**
 * 手机号格式化转换（138 1234 5678）
 */
private class PhoneVisualTransformation : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val digits = text.text
        val formatted = buildString {
            digits.forEachIndexed { index, c ->
                when (index) {
                    3 -> append(" $c")
                    7 -> append(" $c")
                    else -> append(c)
                }
            }
        }
        val offsetTranslator = object : OffsetMapping {
            override fun originalToTransformed(offset: Int): Int {
                return when {
                    offset <= 3 -> offset
                    offset <= 7 -> offset + 1
                    else -> offset + 2
                }
            }
            override fun transformedToOriginal(offset: Int): Int {
                return when {
                    offset <= 3 -> offset
                    offset <= 8 -> offset - 1
                    else -> offset - 2
                }
            }
        }
        return TransformedText(AnnotatedString(formatted), offsetTranslator)
    }
}

enum class LoginMode { PASSWORD, SMS }

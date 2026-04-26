package com.banghe.measure.data.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.banghe.measure.core.App

val AuthViewModelFactory = object : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        val app = App.instance
        return AuthViewModel(app.authRepository) as T
    }
}

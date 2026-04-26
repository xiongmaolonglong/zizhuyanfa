package com.banghe.measure.core.storage

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "preferences")

class PreferencesStore(context: Context) {
    private val dataStore = context.dataStore

    // Suspend getters (for coroutines)
    suspend fun getToken(): String? = dataStore.data.first()[KEY_TOKEN]
    suspend fun getUserId(): Int? = dataStore.data.first()[KEY_USER_ID]
    suspend fun getUserName(): String? = dataStore.data.first()[KEY_USER_NAME]
    suspend fun getUserRole(): String? = dataStore.data.first()[KEY_USER_ROLE]
    suspend fun getPhone(): String? = dataStore.data.first()[KEY_PHONE]
    suspend fun getRememberMe(): Boolean = dataStore.data.first()[KEY_REMEMBER_ME] ?: false

    // Blocking getters (for non-coroutine contexts like OkHttp interceptors)
    fun getTokenBlocking(): String? = runBlocking { dataStore.data.first()[KEY_TOKEN] }
    fun clearAuthBlocking() = runBlocking { clearAuth() }

    // Flow getters for observing
    fun observeToken(): Flow<String?> = dataStore.data.map { it[KEY_TOKEN] }
    fun observeUserId(): Flow<Int?> = dataStore.data.map { it[KEY_USER_ID] }
    fun observeUserRole(): Flow<String?> = dataStore.data.map { it[KEY_USER_ROLE] }

    // Setters
    suspend fun setToken(token: String) {
        dataStore.edit { it[KEY_TOKEN] = token }
    }

    suspend fun setUserInfo(id: Int, name: String, role: String) {
        dataStore.edit {
            it[KEY_USER_ID] = id
            it[KEY_USER_NAME] = name
            it[KEY_USER_ROLE] = role
        }
    }

    suspend fun setPhone(phone: String) {
        dataStore.edit { it[KEY_PHONE] = phone }
    }

    suspend fun setRememberMe(value: Boolean) {
        dataStore.edit { it[KEY_REMEMBER_ME] = value }
    }

    suspend fun clearAuth() {
        dataStore.edit {
            it.remove(KEY_TOKEN)
            it.remove(KEY_USER_ID)
            it.remove(KEY_USER_NAME)
            it.remove(KEY_USER_ROLE)
        }
    }

    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_ID = intPreferencesKey("user_id")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
        private val KEY_PHONE = stringPreferencesKey("saved_phone")
        private val KEY_REMEMBER_ME = booleanPreferencesKey("remember_me")
        private val KEY_NOTIFICATION = booleanPreferencesKey("notification_enabled")
        private val KEY_VOICE = booleanPreferencesKey("voice_enabled")
    }

    // Notification settings
    suspend fun getNotificationEnabled(): Boolean = dataStore.data.first()[KEY_NOTIFICATION] ?: true
    suspend fun setNotificationEnabled(enabled: Boolean) {
        dataStore.edit { it[KEY_NOTIFICATION] = enabled }
    }
    suspend fun getVoiceEnabled(): Boolean = dataStore.data.first()[KEY_VOICE] ?: true
    suspend fun setVoiceEnabled(enabled: Boolean) {
        dataStore.edit { it[KEY_VOICE] = enabled }
    }
    fun observeNotificationEnabled(): Flow<Boolean> = dataStore.data.map { it[KEY_NOTIFICATION] ?: true }
    fun observeVoiceEnabled(): Flow<Boolean> = dataStore.data.map { it[KEY_VOICE] ?: true }
}

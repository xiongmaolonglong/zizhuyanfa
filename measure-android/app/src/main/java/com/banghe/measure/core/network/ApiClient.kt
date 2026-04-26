package com.banghe.measure.core.network

import com.banghe.measure.core.Constants
import com.banghe.measure.core.storage.PreferencesStore
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private lateinit var preferencesStore: PreferencesStore

    fun initialize(store: PreferencesStore) {
        preferencesStore = store
    }

    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    // 单例 OkHttpClient 和 Retrofit
    private val okHttpClient: OkHttpClient by lazy {
        val authInterceptor = AuthInterceptor(preferencesStore)
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(Constants.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    // 缓存已创建的 API 实例
    private val apiCache = mutableMapOf<Class<*>, Any>()

    @Suppress("UNCHECKED_CAST")
    fun <T : Any> createApi(serviceClass: Class<T>): T {
        val cached = apiCache[serviceClass]
        if (cached != null) return cached as T
        val instance = retrofit.create(serviceClass)
        apiCache[serviceClass] = instance as Any
        return instance
    }
}
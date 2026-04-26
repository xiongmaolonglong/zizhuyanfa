package com.banghe.measure.core.database

import androidx.room.TypeConverter

class Converters {
    @TypeConverter
    fun fromStringList(list: List<String>?): String? = list?.joinToString(",")

    @TypeConverter
    fun toStringList(data: String?): List<String>? = data?.split(",")?.filter { it.isNotEmpty() }

    @TypeConverter
    fun fromJsonString(json: String?): String? = json
}

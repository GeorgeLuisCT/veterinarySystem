package com.gaedet.veterinarysystem.core.util;


import java.math.BigInteger;
import java.sql.Time;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class MappingUtil {

    private MappingUtil() {
    }

    public static Long convertToLong(Object value) {
        return value instanceof BigInteger ? ((BigInteger) value).longValue() : (Long) value;
    }

    public static Integer convertToInt(Object value) {
        return value instanceof BigInteger ? ((BigInteger) value).intValue() : (Integer) value;
    }
    public static Double convertToDouble(Object value) {
        return value instanceof Number ? ((Number) value).doubleValue() : null;
    }

    public static LocalTime convertToLocalTime(Object value) {
        return (value instanceof Time) ? ((Time) value).toLocalTime() : null;
    }


    public static Set<String> parseStringSet(String value) {
        return Optional.ofNullable(value)
                .map(v -> new HashSet<String>(Arrays.asList(v.split("¬ "))))
                .orElseGet(HashSet::new);
    }

}

package com.mromanak.bungieapireader.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mromanak.bungieapireader.model.BungieResponseWrapper;
import org.springframework.core.ParameterizedTypeReference;

import java.lang.reflect.Type;
import java.util.Map;

public class TypeUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static <K, V> ParameterizedTypeReference<Map<K, V>> mapType(Class<? extends K> keyType,
        Class<? extends V> valueType) {
        return new ParameterizedTypeReference<Map<K, V>>() {

            @Override
            public Type getType() {
                return MAPPER.getTypeFactory().constructMapType(Map.class, keyType, valueType);
            }
        };
    }

    public static <V> ParameterizedTypeReference<BungieResponseWrapper<V>> bungieResponseFor(
        Class<? extends V> valueType)
    {
        return new ParameterizedTypeReference<BungieResponseWrapper<V>>() {
            @Override
            public Type getType() {
                return MAPPER.getTypeFactory().constructParametricType(BungieResponseWrapper.class, valueType);
            }
        };
    }
}

package com.mromanak.bungieapireader.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

public abstract class AbstractBungieApiService {

    private static final String X_API_KEY_HEADER_NAME = "X-API-Key";
    private static final String BUNGIE_HOST = "www.bungie.net";

    @Value("${bungie.client.clientSecret}")
    private String apiKey;

    protected URI uriFor(String path) {
        return UriComponentsBuilder.newInstance().
            scheme("https").
            host(BUNGIE_HOST).
            path(path).
            build().toUri();
    }

    protected HttpEntity<Object> emptyEntity() {
        return new HttpEntity<>(null, apiHeaders());
    }

    protected <T> HttpEntity<T> entityFor(T body) {
        return new HttpEntity<>(body, apiHeaders());
    }

    protected HttpHeaders apiHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(X_API_KEY_HEADER_NAME, apiKey);
        return headers;
    }
}

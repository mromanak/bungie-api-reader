package com.mromanak.bungieapireader.util;

import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.client.resource.OAuth2ProtectedResourceDetails;
import org.springframework.security.oauth2.client.token.AccessTokenRequest;
import org.springframework.security.oauth2.client.token.DefaultRequestEnhancer;
import org.springframework.util.MultiValueMap;

public class BungieApiRequestEnhancer extends DefaultRequestEnhancer {

    @Override
    public void enhance(AccessTokenRequest request, OAuth2ProtectedResourceDetails resource,
        MultiValueMap<String, String> form, HttpHeaders headers)
    {
        super.enhance(request, resource, form, headers);
        form.remove("client_secret"); // API rejects requests with this header
    }
}

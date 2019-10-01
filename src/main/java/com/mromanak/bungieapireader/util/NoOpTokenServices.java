package com.mromanak.bungieapireader.util;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.OAuth2ClientContext;
import org.springframework.security.oauth2.client.OAuth2RestOperations;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.exceptions.InvalidTokenException;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.OAuth2Request;
import org.springframework.security.oauth2.provider.token.ResourceServerTokenServices;

public class NoOpTokenServices implements ResourceServerTokenServices {

    private final OAuth2ClientContext clientContext;

    public NoOpTokenServices(OAuth2ClientContext clientContext) {
        this.clientContext = clientContext;
    }

    @Override
    public OAuth2Authentication loadAuthentication(String accessToken)
        throws AuthenticationException, InvalidTokenException
    {
        OAuth2Request request = new OAuth2Request(null, null, null, true, null, null, null, null, null);
        return new OAuth2Authentication(request, null);
    }

    @Override
    public OAuth2AccessToken readAccessToken(String accessToken) {
        return clientContext.getAccessToken();
    }
}

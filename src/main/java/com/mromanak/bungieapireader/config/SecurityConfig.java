package com.mromanak.bungieapireader.config;

import com.mromanak.bungieapireader.util.BungieApiRequestEnhancer;
import com.mromanak.bungieapireader.util.NoOpTokenServices;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.OAuth2ClientContext;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.filter.OAuth2ClientAuthenticationProcessingFilter;
import org.springframework.security.oauth2.client.filter.OAuth2ClientContextFilter;
import org.springframework.security.oauth2.client.token.grant.code.AuthorizationCodeAccessTokenProvider;
import org.springframework.security.oauth2.client.token.grant.code.AuthorizationCodeResourceDetails;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableOAuth2Client;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import javax.servlet.Filter;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableOAuth2Client
public class SecurityConfig {

    @Bean
    @ConfigurationProperties("bungie.client")
    public AuthorizationCodeResourceDetails bungie() {
        return new AuthorizationCodeResourceDetails();
    }

    @Bean
    public OAuth2RestTemplate secureRestTemplate(AuthorizationCodeResourceDetails bungieResourceDetails,
        OAuth2ClientContext clientContext)
    {
        OAuth2RestTemplate secureRestTemplate = new OAuth2RestTemplate(bungieResourceDetails, clientContext);

        AuthorizationCodeAccessTokenProvider tokenProvider = new AuthorizationCodeAccessTokenProvider();
        tokenProvider.setTokenRequestEnhancer(new BungieApiRequestEnhancer());
        secureRestTemplate.setAccessTokenProvider(tokenProvider);

        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>(secureRestTemplate.getMessageConverters());
        messageConverters.add(new ResourceHttpMessageConverter());

        return secureRestTemplate;
    }

    @Bean
    public Filter ssoFilter(OAuth2RestTemplate bungieRestTemplate, OAuth2ClientContext clientContext) {
        OAuth2ClientAuthenticationProcessingFilter bungieFilter = new OAuth2ClientAuthenticationProcessingFilter(
            "/login/bungie");
        bungieFilter.setRestTemplate(bungieRestTemplate);
        bungieFilter.setTokenServices(new NoOpTokenServices(clientContext));
        return bungieFilter;
    }

    @Bean
    public WebSecurityConfigurerAdapter webSecurityConfigurerAdapter(Filter ssoFilter,
        OAuth2ClientContextFilter clientContextFilter)
    {
        return new WebSecurityConfigurerAdapter() {
            @Override
            protected void configure(HttpSecurity http) throws Exception {
                http.
                    addFilterAfter(clientContextFilter, AbstractPreAuthenticatedProcessingFilter.class).
                    addFilterAfter(ssoFilter, OAuth2ClientContextFilter.class).
                    authorizeRequests().
                        antMatchers("/", "/login**", "/logout", "/webjars/**", "/public/**", "/content/**", "/error").
                            permitAll().
                        anyRequest().
                            authenticated().
                            and().exceptionHandling().authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login/bungie")).
                            and().logout().logoutSuccessUrl("/").permitAll().
                            and().csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).
                                ignoringAntMatchers("/content/**");
            }
        };
    }
}

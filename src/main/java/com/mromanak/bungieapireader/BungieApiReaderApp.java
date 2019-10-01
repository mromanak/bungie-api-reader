package com.mromanak.bungieapireader;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableOAuth2Client;

@SpringBootApplication
@EnableOAuth2Client
public class BungieApiReaderApp {

    public static void main(String[] args) {
        SpringApplication.run(BungieApiReaderApp.class, args);
    }
}

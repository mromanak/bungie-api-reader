package com.mromanak.bungieapireader.service;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Map;

import static com.mromanak.bungieapireader.util.TypeUtils.mapType;
import static org.apache.commons.lang3.StringUtils.*;
import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Service
public class PrivateApiService extends AbstractBungieApiService {

    private static final String CURRENT_USER_PATH = "/Platform/User/GetMembershipsForCurrentUser/";

    private final OAuth2RestTemplate bungieRestTemplate;

    @Autowired
    public PrivateApiService(OAuth2RestTemplate bungieRestTemplate) {
        this.bungieRestTemplate = bungieRestTemplate;
    }

    @RequestMapping(path = "/user", method = GET)
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        URI profileUrl = uriFor(CURRENT_USER_PATH);
        ParameterizedTypeReference<Map<String, Object>> type = mapType(String.class, Object.class);
        return bungieRestTemplate.exchange(profileUrl, HttpMethod.GET, emptyEntity(), type);
    }

    @RequestMapping("/scratch")
    public ResponseEntity<String> bar(@RequestParam String path) throws IOException {

        path = prependIfMissing(path, "/");
        if (!contains(path, '?')) {
            path = appendIfMissing(path, "/");
        }

        URI profileUrl = UriComponentsBuilder.
            fromHttpUrl("https://www.bungie.net" + path).
            build().toUri();

        ResponseEntity<Resource> resource = bungieRestTemplate
            .exchange(profileUrl, HttpMethod.GET, emptyEntity(), Resource.class);
        try (InputStream inputStream = resource.getBody().getInputStream()) {
            String body = IOUtils.toString(inputStream, resource.getHeaders().getContentType().getCharset());
            return new ResponseEntity<>(body, resource.getHeaders(), resource.getStatusCode());
        }
    }
}

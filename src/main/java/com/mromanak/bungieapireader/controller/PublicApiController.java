package com.mromanak.bungieapireader.controller;

import com.mromanak.bungieapireader.model.BungieResponseWrapper;
import com.mromanak.bungieapireader.model.DestinyManifest;
import com.mromanak.bungieapireader.service.PublicApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
@RequestMapping("/public")
public class PublicApiController {

    private final PublicApiService publicApiService;

    @Autowired
    public PublicApiController(PublicApiService publicApiService) {
        this.publicApiService = publicApiService;
    }

    @RequestMapping(path = "/manifest", method = GET)
    public ResponseEntity<BungieResponseWrapper<DestinyManifest>> getManifest() throws IOException {
        return publicApiService.getManifest();
    }
}

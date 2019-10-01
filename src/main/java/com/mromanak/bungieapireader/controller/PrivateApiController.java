package com.mromanak.bungieapireader.controller;

import com.mromanak.bungieapireader.service.PrivateApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

@Controller
@RequestMapping("/private")
public class PrivateApiController {

    private final PrivateApiService privateApiService;

    @Autowired
    public PrivateApiController(PrivateApiService privateApiService) {
        this.privateApiService = privateApiService;
    }

    @RequestMapping(path = "/user", method = GET)
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        return privateApiService.getCurrentUser();
    }
}

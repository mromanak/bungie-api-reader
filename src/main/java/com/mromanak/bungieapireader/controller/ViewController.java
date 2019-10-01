package com.mromanak.bungieapireader.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import java.util.Map;

@Controller
public class ViewController {

    @RequestMapping("/")
    public ModelAndView index() {
        return new ModelAndView("index");
    }
}

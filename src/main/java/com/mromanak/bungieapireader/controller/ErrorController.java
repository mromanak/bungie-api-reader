package com.mromanak.bungieapireader.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import java.util.Map;

@ControllerAdvice
public class ErrorController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ErrorController.class);

    @ExceptionHandler({Exception.class})
    @RequestMapping("/exception")
    public ModelAndView handleException(Exception e) {
        LOGGER.error("An error occurred: {}", e.getMessage(), e);
        ModelAndView modelAndView = new ModelAndView("exception");
        modelAndView.addObject("exceptionClass", e.getClass().getSimpleName());
        modelAndView.addObject("exceptionMessage", e.getMessage());
        return modelAndView;
    }
}

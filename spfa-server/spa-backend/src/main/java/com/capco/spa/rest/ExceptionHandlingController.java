package com.capco.spa.rest;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.capco.spa.service.exception.MatlabException;
import com.capco.spa.service.exception.SPAInternalApplicationException;
import com.capco.spa.utils.ResponseUtils;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class ExceptionHandlingController {

    @ExceptionHandler(Exception.class)
    public ResponseEntity handleError( HttpServletRequest req, Exception ex) {
        log.error("Request: " + req.getRequestURL() + " raised " + ex, ex);
        return ResponseUtils.buildErrorResponseEntity( ex );
    }

    @ExceptionHandler(SPAInternalApplicationException.class)
    public ResponseEntity handleInternalError( HttpServletRequest req, Exception ex) {
        log.error("Internal exception: " + req.getRequestURL() + " raised " + ex, ex);
        return ResponseUtils.buildErrorResponseEntity( ex );
    }

    @ExceptionHandler(MatlabException.class)
    public ResponseEntity handleMatlabError( HttpServletRequest req, Exception ex) {
        log.error("Matlab operation failed: " + req.getRequestURL() + " raised " + ex, ex);
        return ResponseUtils.buildErrorResponseEntity( ex );
    }
}

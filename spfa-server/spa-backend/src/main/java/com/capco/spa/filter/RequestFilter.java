package com.capco.spa.filter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.log4j.MDC;
import org.springframework.stereotype.Component;

import com.capco.spa.security.SecurityUtils;
import com.capco.spa.utils.Constants;

@Component
public class RequestFilter implements Filter {

    @Override
    public void doFilter( ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain ) throws IOException, ServletException{
        try {
            String requestId = requestId();
            String mdcData = String.format("[user=%s , reqID=%s] ", SecurityUtils.getActiveUserName(), requestId);
            MDC.put("mdcData", mdcData);
            MDC.put( Constants.MDC_REQUEST_ID, requestId);
            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            MDC.clear();
        }
    }

    @Override
    public void init( FilterConfig filterConfig ) throws ServletException{
    }

    @Override
    public void destroy(){
    }

    private String requestId() {
        return RandomStringUtils.random(8, true, true);
    }
}

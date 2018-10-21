package com.capco.spa.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import com.capco.spa.service.exception.SPAInternalApplicationException;

/**
 * Created by S0CRR8 on 18. 9. 2017.
 */
public class SecurityUtils {

    public static final String ROLE_USER = "User";
    public static final String ROLE_ADMIN = "Admin";
    public static final String API_PATH = "/api/**";
    public static final String MANAGE_PATH = "/manage/**";

    public static String getActiveUserName() {
        Object user = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (user != null) {
            return ((User )user).getUsername();
        }
        throw new SPAInternalApplicationException( "SPA user not initialized" );
    }

    public static HttpSecurity authorizeRequests( HttpSecurity httpSecurity) throws Exception{
        // @formatter:off
        return httpSecurity.authorizeRequests()
                .antMatchers( HttpMethod.GET, MANAGE_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers( HttpMethod.POST, MANAGE_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.GET, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.HEAD, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.POST, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.PATCH, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.PUT, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.DELETE, API_PATH).hasAnyRole(ROLE_USER, ROLE_ADMIN)
                .antMatchers(HttpMethod.OPTIONS).denyAll().and();
        // @formatter:on
    }
}

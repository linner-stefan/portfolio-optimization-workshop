package com.capco.spa.security;

import static com.capco.spa.security.SecurityUtils.ROLE_ADMIN;
import static com.capco.spa.security.SecurityUtils.ROLE_USER;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity( securedEnabled = true )
@Profile( "local" )
public class BasicSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure( HttpSecurity http ) throws Exception{
        // @formatter:off
        HttpSecurity httpSecurity = http
                .csrf().disable()
                .httpBasic().and();
        SecurityUtils.authorizeRequests( httpSecurity );
        // @formatter:on
    }

    @Autowired
    public void configureGlobal( AuthenticationManagerBuilder auth ) throws Exception{
        auth
                .inMemoryAuthentication()
                .withUser( "user" ).password( "password" ).roles( ROLE_USER, ROLE_ADMIN );
    }
}
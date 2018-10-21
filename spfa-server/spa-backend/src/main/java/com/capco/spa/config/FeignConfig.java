package com.capco.spa.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.capco.spa.service.employee.Mds;
import com.capco.spa.service.employee.MdsEmployeeModel;
import com.capco.spa.service.employee.Srk;

import feign.Feign;
import feign.Logger;
import feign.Param;
import feign.jackson.JacksonDecoder;
import feign.slf4j.Slf4jLogger;

@Configuration
public class FeignConfig {

    @Bean
    @Profile( "local")
    public Mds provideLocalMds() {
        return new Mds() {
            @Override
            public MdsEmployeeModel getEmployee( @Param( "userId" ) String userId ){
                MdsEmployeeModel mdsEmployeeModel = new MdsEmployeeModel();
                mdsEmployeeModel.setLegalFirstName( "John" );
                mdsEmployeeModel.setLegalLastName( "Joe" );
                return mdsEmployeeModel;
            }
        };
    }

    private Feign.Builder baseBuilder() {
        return Feign.builder().decode404().decoder(new JacksonDecoder()).logger(new Slf4jLogger()).logLevel(Logger.Level.BASIC);
    }
}

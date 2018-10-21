package com.capco.spa.jpa;

import java.net.URL;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.lookup.JndiDataSourceLookup;

import lombok.extern.java.Log;

@Configuration
@Log
public class SPADataSourceConfig {

    @Value( "${h2.filepath}" )
    private String h2FilePath;

    @Bean(name = "primaryDS")
    @Profile("local")
    @Primary
    public DataSource loadingDataSource() {
        log.info("Initializing h2 datasource for integration tests..");
        URL resource = getClass().getClassLoader().getResource( h2FilePath );
        String dataSourceUrl =  "jdbc:h2:"+resource.getPath().replace( ".mv.db","" )+"";
        return DataSourceBuilder.create().url( dataSourceUrl ).username( "sa" ).build();
    }

}

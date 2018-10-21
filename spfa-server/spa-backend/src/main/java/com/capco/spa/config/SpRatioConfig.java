package com.capco.spa.config;

import java.util.HashMap;
import java.util.Map;

import javax.validation.constraints.NotNull;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;

/**
 * Created by Stefan Linner on 23/11/2017.
 */
@ConfigurationProperties(prefix="spa.spRatio", ignoreUnknownFields = false)
@Component
@Getter
public class SpRatioConfig {

    @NotNull
    private Map<Long,Double> diversificationFactors = new HashMap<>();
}

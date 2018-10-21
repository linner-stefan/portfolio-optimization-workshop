package com.capco.spa.service.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by Stefan Linner on 24/11/2017.
 */
@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class AssetClassGroupUpdateDto {
    private Long id;

    private String name;

    private BigDecimal volatility;
}

package com.capco.spa.service.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Created by Stefan Linner on 8. 6. 2017.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Getter
@Setter
@ToString
public class PortfolioAllocationDto {

	private Long id;

	private Long portfolioId;

	private String portfolioLabel;

	private String portfolioSetLabel;

	private Long assetClassId;

	private String assetClassName;

	private BigDecimal navTotal;

	private BigDecimal navPercentage;
	
	private BigDecimal ctr;
}

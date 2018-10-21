package com.capco.spa.service.dto;

import java.math.BigDecimal;
import java.util.List;

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
public class PortfolioDto {

	private Long id;

	private Long calculationId;

	private String label;

	private String setLabel;

	private List<PortfolioAllocationDto> allocations;

	private BigDecimal portfolioReturn;

	private BigDecimal trackingError;

}

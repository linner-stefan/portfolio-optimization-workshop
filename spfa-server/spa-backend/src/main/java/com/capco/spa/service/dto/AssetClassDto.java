package com.capco.spa.service.dto;

import java.math.BigDecimal;
import java.util.List;

import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.capco.spa.jpa.entity.AssetClassType;
import lombok.Data;

@Data
@JsonInclude(Include.NON_EMPTY)
public class AssetClassDto {

	private Long id;
	private String name;
	private AssetClassType type;
	private String avalonId;
	private Integer riskFactorWeight;
	private BigDecimal marketRiskPremium;
	private BigDecimal mrpOasFactor;
	@NotNull
	private BigDecimal marketCap;
	private BigDecimal transactionCost;
	private Boolean selected;
	private BigDecimal totalReturn;
	private BigDecimal adjustedAllocation;
	private BigDecimal duration;
	private BigDecimal spAssetRiskCharge;

	private BigDecimal prospectiveReturn;
	private BigDecimal investmentViewReturn;
	private BigDecimal marketReturn;

	private List<PortfolioAllocationDto> portfolioAllocations;

}

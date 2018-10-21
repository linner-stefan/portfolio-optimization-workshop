package com.capco.spa.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.Data;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Data
@ToString(callSuper = true)
@JsonInclude(Include.NON_EMPTY)
public class CalculationDtoMin {
	private List<AssetClassGroupDto> assetClassGroups;

	private List<PortfolioDto> efficientPortfoliosUser;

}

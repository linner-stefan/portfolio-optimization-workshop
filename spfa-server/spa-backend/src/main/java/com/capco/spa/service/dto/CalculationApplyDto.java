package com.capco.spa.service.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Created by Stefan Linner.
 */
@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CalculationApplyDto extends CalculationUpdateDto {

    private List<PortfolioDto> efficientPortfoliosMarket;
    private List<PortfolioDto> efficientPortfoliosUser;
    private List<PortfolioDto> efficientPortfoliosIs;
    private PortfolioDto currentPortfolio;
    private PortfolioDto userDefinedPortfolio;
}

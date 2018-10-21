package com.capco.spa.service.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.capco.spa.utils.ZeroOneRange;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by E5370259 on 5/15/2017.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Getter
@Setter
public class AllocationConstraintDto {

    private Long id;

    @ZeroOneRange
    private BigDecimal upperBound;
    @ZeroOneRange
    private BigDecimal adjustedUpperBound;

    @ZeroOneRange
    private BigDecimal lowerBound;
    @ZeroOneRange
    private BigDecimal adjustedLowerBound;

    private Boolean aggregation;
    private Boolean adjustedAggregation;
}

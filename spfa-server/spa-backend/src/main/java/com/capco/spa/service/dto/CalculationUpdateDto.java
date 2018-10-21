package com.capco.spa.service.dto;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by E5370259 on 5/19/2017.
 */
@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CalculationUpdateDto {

    private List<AssetClassDto> assetClasses;       // received changes from FE
    private List<AssetClassGroupUpdateDto> assetClassGroups;      // changed AC from FE affect AC groups, therefore we need to send these changes back
    private List<AllocationConstraintDto> allocationConstraints;
    private BigDecimal spRatioUpperBound;
    private IOBundleJsonDto ioBundle;
}

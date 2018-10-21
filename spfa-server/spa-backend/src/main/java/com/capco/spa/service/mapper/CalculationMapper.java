package com.capco.spa.service.mapper;

import com.capco.spa.jpa.entity.Calculation;
import com.capco.spa.service.dto.*;
import com.capco.spa.service.matlab.data.InputOutputBundle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {AssetClassMapper.class, ConstraintMapper.class,
        PortfolioMapper.class})
public interface CalculationMapper {

    CalculationDtoMin mapCalculationToPortfolioDtoList(Calculation calculation);

    @Mappings({
            @Mapping( target = "assetClassGroups", qualifiedByName = "acg-dto-recursive"),
    })
    CalculationDtoMin mapCalculationToDtoWithAssetClassAndRiskFactorGroupHierarchy( Calculation calculation);


    default CalculationDtoMin mapCalculationToDto(Calculation calculation) {
        calculation.setAssetClassGroups(calculation.getAssetClassGroups()
                .stream()
                .filter(acg -> acg.getParent() == null)
                .collect(Collectors.toList()));

        return mapCalculationToDtoWithAssetClassAndRiskFactorGroupHierarchy(calculation);
    }

    IOBundleJson mapIOBundleToJson( InputOutputBundle inputOutputBundle);

    InputOutputBundle mapJsonToIOBundle(IOBundleJson ioBundleJson );

    IOBundleJsonDto mapIoBundleJsonToIoBundleJsonDto( IOBundleJson ioBundleJson );

    IOBundleJson mapIoBundleJsonDtoToIoBundleJson( IOBundleJsonDto ioBundleJsonDto );

}

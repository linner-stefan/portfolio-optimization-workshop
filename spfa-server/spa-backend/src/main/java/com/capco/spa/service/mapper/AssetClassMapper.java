package com.capco.spa.service.mapper;


import com.capco.spa.service.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import com.capco.spa.jpa.entity.AssetClass;
import com.capco.spa.jpa.entity.AssetClassGroup;

@Mapper( componentModel = "spring", uses = {ConstraintMapper.class, PortfolioMapper.class} )
public interface AssetClassMapper {

    @Mappings( {
            @Mapping( source = "assetClass", target = "assetClassDto" ),
            @Mapping( target = "subGroups", qualifiedByName = "acg-dto-recursive" ),
            @Mapping( source = "allocationConstraint", target = "allocationConstraintDto" )
    } )
    @Named( "acg-dto-recursive" )
    AssetClassGroupDto mapAssetClassGroupToDTORecursive( AssetClassGroup assetClassGroup );

    @Mappings( {
            @Mapping( target = "subGroups", ignore = true),
            @Mapping( source = "assetClass", target = "assetClassDto", qualifiedByName = "ac-with-allocation"),
            @Mapping( source = "allocationConstraint", target = "allocationConstraintDto" )
    } )
    AssetClassGroupDto mapAssetClassGroupToDTO( AssetClassGroup assetClassGroup );

    @Mappings( {
            @Mapping( target = "portfolioAllocations", ignore = true )
    })
    AssetClassDto mapAssetClassToDTO( AssetClass assetClass );

    @Mappings( {
            @Mapping( target = "portfolioAllocations", ignore = false )
    })
    @Named( "ac-with-allocation" )
    AssetClassDto mapAssetClassToDTOWithAllocations( AssetClass assetClass );

    default Long mapAssetClassToId( AssetClass assetClass ) {

        return assetClass.getId();
    }

}

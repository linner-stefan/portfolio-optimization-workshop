package com.capco.spa.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import com.capco.spa.jpa.entity.Portfolio;
import com.capco.spa.jpa.entity.PortfolioAllocation;
import com.capco.spa.jpa.entity.PortfolioLabel;
import com.capco.spa.jpa.entity.PortfolioSetLabel;
import com.capco.spa.service.dto.PortfolioAllocationDto;
import com.capco.spa.service.dto.PortfolioDto;

/**
 * Created by Stefan Linner on 8. 6. 2017.
 */
@Mapper(componentModel = "spring")
public interface PortfolioMapper {

	PortfolioDto mapPortfolioToPortfolioDto( Portfolio portfolio );

	@Mappings( {
			@Mapping( target = "portfolioId", source = "portfolio.id"),
			@Mapping( target = "assetClassId", source = "assetClass.id"),
			@Mapping( target = "portfolioLabel", source = "portfolio.label"),
			@Mapping( target = "portfolioSetLabel", source = "portfolio.setLabel")
	} )
	PortfolioAllocationDto mapPortfolioAllocationToPortfolioAllocationDto( PortfolioAllocation portfolioAllocation );


	default String mapPortfolioLabelToString( PortfolioLabel portfolioLabel ) {
		return portfolioLabel.toString();
	}
	default String mapPortfolioSetLabelToString( PortfolioSetLabel portfolioSetLabel ) {
		return portfolioSetLabel != null ? portfolioSetLabel.toString() : null;
	}
}

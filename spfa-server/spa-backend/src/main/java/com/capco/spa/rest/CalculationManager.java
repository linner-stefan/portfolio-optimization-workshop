package com.capco.spa.rest;

import com.capco.spa.service.CalculationService;
import com.capco.spa.service.dto.AllocationConstraintDto;
import com.capco.spa.service.dto.CalculationApplyDto;
import com.capco.spa.service.dto.CalculationDtoMin;
import com.capco.spa.service.dto.PortfolioDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping( "api/calculation" )
public class CalculationManager {

    @Autowired
    private CalculationService calculationService;

    @RequestMapping( value = "/{id:[\\d]+}", method = RequestMethod.GET )
    public ResponseEntity<CalculationDtoMin> getCalculationById( @PathVariable( "id" ) Long id ){
        CalculationDtoMin calculationDto = calculationService.findCalculationDtoById( id );
        if ( calculationDto != null ) {
            return ResponseEntity.ok( calculationDto );
        }
        return ResponseEntity.notFound().build();
    }

    @RequestMapping( path = "/{id:[\\d]+}/apply", method = RequestMethod.POST )
    public CalculationApplyDto applyCalculationSimple( @PathVariable( "id" ) Long calculationId, @RequestBody List<AllocationConstraintDto> allocationConstraints ){

        log.info( "Apply for calculationId '{}' input = {}", calculationId, allocationConstraints );
        List<PortfolioDto> portfolioDtoList = calculationService.applyCalculation( calculationId, allocationConstraints );
        log.debug( "Apply for calculationId '{}' output = {}", calculationId, portfolioDtoList );

        CalculationApplyDto calculationApplyDto = new CalculationApplyDto();
        calculationApplyDto.setEfficientPortfoliosUser( portfolioDtoList );

        return calculationApplyDto;
    }

}

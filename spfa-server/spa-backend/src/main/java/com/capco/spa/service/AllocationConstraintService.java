package com.capco.spa.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.capco.spa.jpa.entity.AllocationConstraint;
import com.capco.spa.service.dto.AllocationConstraintDto;

import lombok.extern.slf4j.Slf4j;

/**
 * Created by E5370259 on 5/29/2017.
 */
@Service
@Transactional
@Slf4j
public class AllocationConstraintService {

    public static void updateAllocationConstraints( @Valid Collection<AllocationConstraint> allocationConstraints, List<AllocationConstraintDto> allocationConstraintDtos ){

        Map<Long,AllocationConstraint> allocationConstraintMap = allocationConstraints
                .stream()
                .collect( Collectors.toMap( ac -> ac.getId(), ac -> ac ) );

        allocationConstraintDtos.forEach( acDto -> {

            AllocationConstraint ac = allocationConstraintMap.get( acDto.getId() );
            if ( ac != null ) {

                ac.setAdjustedLowerBound( acDto.getAdjustedLowerBound() );
                ac.setAdjustedUpperBound( acDto.getAdjustedUpperBound() );
                ac.setAdjustedAggregation( acDto.getAdjustedAggregation() );
            }
        } );
    }


}
package com.capco.spa.service.mapper;

import java.math.BigDecimal;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import com.capco.spa.jpa.entity.AllocationConstraint;
import com.capco.spa.service.dto.AllocationConstraintDto;

/**
 * Created by S8GPNK on 8. 6. 2017.
 */
@Mapper( componentModel = "spring" )
public interface ConstraintMapper {

    AllocationConstraintDto mapAllocationConstraintToDto( AllocationConstraint allocationConstraint );

}

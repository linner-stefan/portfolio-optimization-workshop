package com.capco.spa.service.matlab.data;

import static com.capco.spa.service.matlab.data.MatlabConstraint.MatlabConstraintType.ALLOCATION_CONSTRAINT;
import static com.capco.spa.service.matlab.data.MatlabConstraint.MatlabConstraintType.LOWER_BOUND_CONSTRAINT;
import static com.capco.spa.service.matlab.data.MatlabConstraint.MatlabConstraintType.UPPER_BOUND_CONSTRAINT;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import com.capco.spa.jpa.entity.AbstractAssetClass;
import com.capco.spa.jpa.entity.AllocationConstraint;

/**
 * Created by Stefan Linner on 16. 7. 2017.
 */
public class MatlabConstraint {

    private final MatlabConstraintType constraintType;

    public enum MatlabConstraintType{
        ALLOCATION_CONSTRAINT,
        UPPER_BOUND_CONSTRAINT,  // currently S&P Ratio constraint
        LOWER_BOUND_CONSTRAINT
    }

    private BigDecimal constraint;  // lower OR upper
    private AllocationConstraint allocationConstraint;

    private Set<String> assetClassNames;
    private double[] acCoefficients;    // order by ioBundle.acNamesFromIndex

    public MatlabConstraint( AllocationConstraint allocationConstraint ){
        constraintType = ALLOCATION_CONSTRAINT;
        this.allocationConstraint = allocationConstraint;
        this.assetClassNames = allocationConstraint.getAssetClassGroup().extractAssetClasses().stream()
                .map( AbstractAssetClass::getName ).collect( Collectors.toSet() );
    }

    public Set<String> getAssetClassNames(){
        return this.assetClassNames;
    }

    public BigDecimal getLowerBound(){
        if ( constraintType.equals( ALLOCATION_CONSTRAINT ) ) {
            return allocationConstraint.getAdjustedLowerBound();
        }
        else if ( constraintType.equals( LOWER_BOUND_CONSTRAINT ) ){
            return constraint;
        }
        else if ( constraintType.equals( UPPER_BOUND_CONSTRAINT ) ){
            return null;
        }
        throw new IllegalStateException("Unknown MatlabConstraintType!");
    }

    public BigDecimal getUpperBound(){
        if ( constraintType.equals( ALLOCATION_CONSTRAINT ) ) {
            return allocationConstraint.getAdjustedUpperBound();
        }
        else if ( constraintType.equals( LOWER_BOUND_CONSTRAINT ) ){
            return null;
        }
        else if ( constraintType.equals( UPPER_BOUND_CONSTRAINT ) ){
            return constraint;
        }
        throw new IllegalStateException("Unknown MatlabConstraintType!");
    }

    public double[] getAcCoefficients(){
        return acCoefficients;
    }

    public AllocationConstraint.BindingType getBinding(){
        if ( constraintType.equals( ALLOCATION_CONSTRAINT ) ){
            return allocationConstraint.getBinding();
        }
        return null;
    }

}

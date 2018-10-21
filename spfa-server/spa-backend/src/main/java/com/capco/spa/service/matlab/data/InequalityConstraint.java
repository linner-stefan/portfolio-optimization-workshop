package com.capco.spa.service.matlab.data;

import com.capco.spa.jpa.entity.AllocationConstraint;
import com.capco.spa.utils.GeneralUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.DoubleStream;

/**
 * Created by Stefan Linner on 16. 7. 2017.
 */
public class InequalityConstraint {

    private static final double LEQ_COEF = 1;
    private static final double GEQ_COEF = - 1;

    private Map<String,Integer> acNamesToIndex;
    private List<MatlabConstraint> matlabConstraints;

    private ArrayList<ArrayList<Double>> allocConstraintIneqCoefMat;
    private ArrayList<Double> allocConstraintIneqConstVec;

    public InequalityConstraint( InputOutputBundle ioBundle, List<MatlabConstraint> matlabConstraints ){
        this.acNamesToIndex = ioBundle.getAcNamesToIndex();
        this.matlabConstraints = matlabConstraints;
    }

    public double[][] getAllocConstraintIneqCoefMat(){
        if ( allocConstraintIneqCoefMat == null || allocConstraintIneqCoefMat.size() < 1 ){
            return new double[1][acNamesToIndex.size()];
        }
        return GeneralUtils.convertToMatrix( allocConstraintIneqCoefMat );
    }

    public double[] getAllocConstraintIneqConstVec(){
        if ( allocConstraintIneqConstVec == null || allocConstraintIneqConstVec.size() < 1 ){
            return new double[1];
        }
        return allocConstraintIneqConstVec.stream().mapToDouble(Double::doubleValue).toArray();
    }

    public InequalityConstraint invoke(){

        allocConstraintIneqCoefMat = new ArrayList<>();
        allocConstraintIneqConstVec = new ArrayList<>();

        matlabConstraints.forEach( constraint -> {

            BigDecimal lowerBound = constraint.getLowerBound();
            BigDecimal upperBound = constraint.getUpperBound();

            // zero lower bound is already set in MATLAB as a lb vector
            // one upper bound is already set in MATLAB as an equality constraint

            if ( lowerBound != null && lowerBound.compareTo( BigDecimal.ZERO ) != 0 &&
                    ! AllocationConstraint.BindingType.GEQ.equals( constraint.getBinding() ) ) {

                addConstraint( constraint, lowerBound, GEQ_COEF );
            }

            if ( upperBound != null && upperBound.compareTo( BigDecimal.ONE ) != 0 &&
                    ! AllocationConstraint.BindingType.LEQ.equals( constraint.getBinding() ) ) {

                addConstraint( constraint, upperBound, LEQ_COEF );
            }

        } );

        return this;
    }

    private void addConstraint( MatlabConstraint constraint, BigDecimal bound, double coefType ){
        ArrayList<Double> row = getZeroArray( acNamesToIndex.size() );
        allocConstraintIneqCoefMat.add( row );

        double constant;
        if ( constraint.getAssetClassNames().size() > 0 ) {

            constraint.getAssetClassNames().forEach( acName ->{
                Integer acIndex = acNamesToIndex.get( acName );

                double coefValue = getCoefValue( constraint, acIndex );
                row.set( acIndex, coefType * coefValue );

            });

            constant = coefType == GEQ_COEF ? bound.negate().doubleValue() : bound.doubleValue();
        }
        else {
            constant = 0.0;
        }

        allocConstraintIneqConstVec.add( constant );
    }

    private double getCoefValue( MatlabConstraint constraint, Integer acIndex ){
        double[] acCoefficients = constraint.getAcCoefficients();
        if ( acCoefficients == null )
            return 1.0;
        return Double.isNaN( acCoefficients[acIndex]) ? 0.0 : acCoefficients[acIndex];
    }

    private ArrayList<Double> getZeroArray( int size ){
        return DoubleStream.of( new double[size] )
                            .mapToObj( Double::valueOf )
                            .collect( Collectors.toCollection( ArrayList::new ) );
    }

}

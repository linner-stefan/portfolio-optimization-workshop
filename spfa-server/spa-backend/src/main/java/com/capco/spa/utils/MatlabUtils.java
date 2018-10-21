package com.capco.spa.utils;

import com.capco.spa.jpa.entity.*;
import com.capco.spa.service.JavaCalculations;
import com.capco.spa.service.matlab.data.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;


/**
 * All operations related to Matlab calculations, e.g.: <br/>
 * - data transformations to/from matrix of doubles/Cells, <br/>
 * - specific matrix constructions for a given matlab function from data retrieved from database or front-end
 *
 * Created by Stefan Linner on 5. 6. 2017.
 */
@Slf4j
@Component
public class MatlabUtils {

    private static Integer timeSeriesMaxGap;
    private Boolean useOnlyTotalDurationConstraint;

    @Autowired
    private JavaCalculations javaCalculations;


    @Value("${spa.avalon.time-series.maxGap:}")
    public void setTimeSeriesMaxGap( Integer timeSeriesMaxGap ){
        MatlabUtils.timeSeriesMaxGap = timeSeriesMaxGap;
    }

    @Value("${spa.portfolioOptimization.useOnlyTotalDurationConstraint:}")
    public void setUseOnlyTotalDurationConstraint( Boolean useOnlyTotalDurationConstraint ){
        this.useOnlyTotalDurationConstraint = useOnlyTotalDurationConstraint;
    }

    /**
     * Prepares input also for the cost of constraints calculation.
     *
     * @param ioBundle
     * @param calculation
     */
    public void prepareInputForPortfolioOptimization( InputOutputBundle ioBundle, Calculation calculation ){

//        preparePillarWeights( ioBundle );

        //// constraints
//        prepareDurationConstraints( ioBundle, calculation );

        List<AssetClassGroup> assetClassGroups = calculation.getAssetClassGroups();

        List<MatlabConstraint> matlabConstraints = getMatlabConstraints( assetClassGroups);

        // inequality constraint
        InequalityConstraint inequalityConstraint = new InequalityConstraint( ioBundle, matlabConstraints ).invoke();
        ioBundle.setAllocConstraintIneqCoefMat( inequalityConstraint.getAllocConstraintIneqCoefMat() );
        ioBundle.setAllocConstraintIneqConstVec( inequalityConstraint.getAllocConstraintIneqConstVec() );

    }

    private  List<MatlabConstraint> getMatlabConstraints( List<AssetClassGroup> assetClassGroups ){

        // filter out only regular allocation constraints (not aggregated)
        List<MatlabConstraint> matlabConstraints = assetClassGroups.stream()
                .sorted( Comparator.comparing( AbstractAssetClassGroup::getLevel ) )
                .sorted( Comparator.comparing( AbstractAssetClassGroup::getItemOrder ) ) // sort only for easier debugging
                .filter( acg -> ! acg.getAllocationConstraint().getAdjustedAggregation() )

                // workshop filters
                // only top level groups
                .filter( acg -> acg.getParent() == null )

                .map( acg -> new MatlabConstraint( acg.getAllocationConstraint() ) )
                .collect( Collectors.toList() );

        return matlabConstraints;
    }


}

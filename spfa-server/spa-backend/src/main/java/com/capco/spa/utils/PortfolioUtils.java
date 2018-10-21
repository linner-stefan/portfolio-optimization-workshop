package com.capco.spa.utils;

import com.capco.spa.jpa.entity.*;
import com.capco.spa.service.JavaCalculations;
import com.capco.spa.service.matlab.data.InputOutputBundle;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Created by Stefan Linner on 30/10/2017.
 */
@Slf4j
@Component
public class PortfolioUtils {

    private final MatlabUtils matlabUtils;

    private final JavaCalculations javaCalculations;

    @Autowired
    public PortfolioUtils( MatlabUtils matlabUtils, JavaCalculations javaCalculations ){
        this.matlabUtils = matlabUtils;
        this.javaCalculations = javaCalculations;
    }

    public void setPortfolios( InputOutputBundle ioBundle, Calculation calculation ){
        List<AssetClassGroup> assetClassGroups = calculation.getAssetClassGroups();

        double[][] efWeights = ioBundle.getEfficientPortfoliosMat();
        double[] efReturns = ioBundle.getEfficientsReturnsVec();
        double[] trackingErrors = ioBundle.getTrackingErrorsVec();
        double[][] acCtr = new double[efWeights.length][];

        double[][] efWeightsIs = ioBundle.getEfficientPortfoliosIsMat();
        double[] efReturnsIs = ioBundle.getEfficientsReturnsIsVec();
        double[] trackingErrorsIs = ioBundle.getTrackingErrorsIsVec();
        double[][] acCtrIs = new double[efWeights.length][];

        double[][] efWeightsMarket = ioBundle.getEfficientPortfoliosMarketMat();
        double[] efReturnsMarket = ioBundle.getEfficientsReturnsMarketVec();
        double[] trackingErrorsMarket = ioBundle.getTrackingErrorsMarketVec();
        double[][] acCtrMarket = new double[efWeights.length][];

        Set<Portfolio> efficientPortfoliosUser = calculation.getEfficientPortfoliosUser();
        Set<Portfolio> efficientPortfoliosIs = calculation.getEfficientPortfoliosIs();
        Set<Portfolio> efficientPortfoliosMarket = calculation.getEfficientPortfoliosMarket();
        if ( efficientPortfoliosUser == null ) {
            efficientPortfoliosUser = new LinkedHashSet<>();
            calculation.setEfficientPortfoliosUser( efficientPortfoliosUser );
        }
        if ( efficientPortfoliosIs == null ) {
            efficientPortfoliosIs = new LinkedHashSet<>();
            calculation.setEfficientPortfoliosIs( efficientPortfoliosIs );
        }
        if ( efficientPortfoliosMarket == null ) {
            efficientPortfoliosMarket = new LinkedHashSet<>();
            calculation.setEfficientPortfoliosMarket( efficientPortfoliosMarket );
        }
        Map<PortfolioLabel,Portfolio> efficientPortfoliosUserMap = getLabelToPortfolioMap( efficientPortfoliosUser );
        Map<PortfolioLabel,Portfolio> efficientPortfoliosIsMap = getLabelToPortfolioMap( efficientPortfoliosIs );
        Map<PortfolioLabel,Portfolio> efficientPortfoliosMarketMap = getLabelToPortfolioMap( efficientPortfoliosMarket );

        PortfolioLabel[] labels = PortfolioLabel.values();
        for ( int labelIndex = 0; labelIndex < labels.length; labelIndex++ ) {

            PortfolioLabel label = labels[labelIndex];

            switch ( labels[labelIndex] ) {

                // efficient portfolios A-I from MATLAB
                default:

                    int portfolioIndex = label.getPortfolioIndex();

                    setPortfolioData( PortfolioSetLabel.UserDefined, ioBundle, assetClassGroups, efWeights, efReturns, trackingErrors, acCtr,
                            efficientPortfoliosUser, efficientPortfoliosUserMap, label, portfolioIndex );

                    setPortfolioData( PortfolioSetLabel.Investment, ioBundle, assetClassGroups, efWeightsIs, efReturnsIs, trackingErrorsIs, acCtrIs,
                            efficientPortfoliosIs, efficientPortfoliosIsMap, label, portfolioIndex );

                    setPortfolioData( PortfolioSetLabel.Market, ioBundle, assetClassGroups, efWeightsMarket, efReturnsMarket, trackingErrorsMarket, acCtrMarket,
                            efficientPortfoliosMarket, efficientPortfoliosMarketMap, label, portfolioIndex );
            }
        }

    }

    public double getUserDefinedTe( InputOutputBundle ioBundle ){
        return javaCalculations.portfolioTrackingError( ioBundle.getWeightsP4UDef(), ioBundle.getWeightsP1UDef(),
                ioBundle.getAcCovarianceMat() );
    }

    public double getUserDefinedReturn( InputOutputBundle ioBundle ){
        return javaCalculations.portfolioReturn( ioBundle.getWeightsP4UDef(), ioBundle.getWeightsP1UDef(),
                ioBundle.getAcProspectiveReturnsVec() );
    }

    public double getCurrentTe( InputOutputBundle ioBundle ){
        return javaCalculations.portfolioTrackingError( ioBundle.getWeightsP4(), ioBundle.getWeightsP1UDef(),
                ioBundle.getAcCovarianceMarketMat() );
    }

    public double getCurrentReturn( InputOutputBundle ioBundle ){
        return javaCalculations.portfolioReturn( ioBundle.getWeightsP4(), ioBundle.getWeightsP1UDef(),
                ioBundle.getAcProspectiveReturnsVec() );
    }

    private void setPortfolioData( PortfolioSetLabel setLabel, InputOutputBundle ioBundle, List<AssetClassGroup> assetClassGroups,
                                   double[][] efWeights, double[] efReturns, double[] trackingErrors, double[][] ctr, Set<Portfolio> efficientPortfolios,
                                   Map<PortfolioLabel,Portfolio> efficientPortfoliosMap, PortfolioLabel label, int portfolioIndex ){
        Portfolio portfolio;
        if ( efWeights == null || portfolioIndex >= efWeights.length || portfolioIndex < 0 ) {
            log.warn( "No efficient portfolio with the index '{}' in the set {}", portfolioIndex, setLabel );
        } else {
            portfolio = efficientPortfoliosMap.get( label );
            if ( portfolio == null ) {
                portfolio = createPortfolio( label );
                portfolio.setSetLabel( setLabel );
                efficientPortfolios.add( portfolio );
            }

            setPortfolioData( portfolio, ioBundle, assetClassGroups, efWeights[portfolioIndex], efReturns[portfolioIndex],
                    trackingErrors[portfolioIndex], ctr.length - 1 >= portfolioIndex ? ctr[portfolioIndex] : new double[0] );

        }
    }

    private Map<PortfolioLabel,Portfolio> getLabelToPortfolioMap( Set<Portfolio> efficientPortfolios ){
        return efficientPortfolios.stream().collect( Collectors.toMap( Portfolio::getLabel, p -> p ) );
    }

    private Portfolio createPortfolio( PortfolioLabel label ){
        Portfolio portfolio = new Portfolio();
        portfolio.setLabel( label );
        return portfolio;
    }

    private void setPortfolioData( Portfolio portfolio, InputOutputBundle ioBundle, List<AssetClassGroup> assetClassGroups,
                                   double[] weights, double portfolioReturn, double trackingError, double[] ctr ){

        portfolio.setPortfolioReturn( BigDecimal.valueOf( portfolioReturn ) );
        portfolio.setTrackingError( BigDecimal.valueOf( trackingError ) );

        Set<PortfolioAllocation> allocations = portfolio.getAllocations();
        if ( allocations != null ) {
            updatePortfolioAllocations( ioBundle, weights, ctr, allocations );
        } else {
            allocations = getPortfolioAllocations( ioBundle, assetClassGroups, weights, ctr, portfolio );
            portfolio.setAllocations( allocations );
        }
    }

    /**
     * Also sets allocations to the asset class
     *
     * @param ioBundle
     * @param assetClassGroups
     * @param weights
     * @param portfolio
     * @return
     */
    private static Set<PortfolioAllocation> getPortfolioAllocations( InputOutputBundle ioBundle, List<AssetClassGroup> assetClassGroups,
                                                                     double[] weights, double[] ctr, Portfolio portfolio ){
        Set<PortfolioAllocation> allocations = new LinkedHashSet<>();

        Map<String,Integer> acNamesToIndex = ioBundle.getAcNamesToIndex();
        double p4NavSum = ioBundle.getP4sum();

        assetClassGroups.stream().filter( acg -> acg.getAssetClass() != null )
                .forEach( acg -> {
                    AssetClass ac = acg.getAssetClass();

                    PortfolioAllocation allocation = new PortfolioAllocation();
                    allocation.setPortfolio( portfolio );
                    allocation.setAssetClass( ac );

                    String acName = ac.getName();
                    int acIndex = acNamesToIndex.get( acName );
                    double weight = weights[acIndex];

                    allocation.setNavPercentage( BigDecimal.valueOf( weight ) );
                    allocation.setNavTotal( BigDecimal.valueOf( weight * p4NavSum ) );
                    if ( ctr != null && ctr.length - 1 >= acIndex ) {
                        allocation.setCtr( BigDecimal.valueOf( ctr[acIndex] ) );
                    }
                    ac.addPortfolioAllocation( allocation );
                    allocations.add( allocation );

                } );

        return allocations;
    }

    private static void updatePortfolioAllocations( InputOutputBundle ioBundle, double[] weights, double[] ctr, Set<PortfolioAllocation> allocations ){

        Map<String,Integer> acNamesToIndex = ioBundle.getAcNamesToIndex();
        double p4NavSum = ioBundle.getP4sum();

        allocations.forEach( allocation -> {

            String acName = allocation.getAssetClass().getName();
            int acIndex = acNamesToIndex.get( acName );
            double weight = weights[acIndex];

            allocation.setNavPercentage( BigDecimal.valueOf( weight ) );
            allocation.setNavTotal( BigDecimal.valueOf( weight * p4NavSum ) );
            if ( ctr != null && ctr.length - 1 >= acIndex ) {
                allocation.setCtr( BigDecimal.valueOf( ctr[acIndex] ) );
            }

        } );

    }
}

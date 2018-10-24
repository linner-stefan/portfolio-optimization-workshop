package com.capco.spa.service;

import com.capco.spa.jpa.dao.CalculationDao;
import com.capco.spa.jpa.entity.AbstractAssetClassGroup;
import com.capco.spa.jpa.entity.AssetClassGroup;
import com.capco.spa.jpa.entity.Calculation;
import com.capco.spa.service.dto.AllocationConstraintDto;
import com.capco.spa.service.dto.CalculationDtoMin;
import com.capco.spa.service.dto.PortfolioDto;
import com.capco.spa.service.exception.MatlabException;
import com.capco.spa.service.exception.SPAInternalApplicationException;
import com.capco.spa.service.mapper.CalculationMapper;
import com.capco.spa.service.matlab.data.InputOutputBundle;
import com.capco.spa.service.matlab.data.PortfolioOptimizationOutput;
import com.capco.spa.utils.MatlabUtils;
import com.capco.spa.utils.PortfolioUtils;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@ConfigurationProperties( prefix = "spa.calculationService", ignoreUnknownFields = false )
public class CalculationService {

    @NonNull
    private Boolean srLibEnabled;

    @Autowired
    private CalculationDao calculationDao;

    @Autowired
    private CalculationMapper calculationMapper;

    @Autowired
    private MatlabUtils matlabUtils;

    @Autowired
    private PortfolioUtils portfolioUtils;

    @Autowired
    private JavaCalculations javaCalculations;

    public Calculation findCalculationById( Long id ){
        Calculation calculation = calculationDao.findCalculationById( id );
        if ( calculation == null ) {
            throw new SPAInternalApplicationException( "Calculation not found " + id );
        }

        return calculation;
    }

    public CalculationDtoMin findCalculationDtoById( Long id ){
        Calculation calculation = findCalculationById( id );
        if ( calculation == null ) return null;
        return calculationMapper.mapCalculationToDto( calculation );
    }

    private void calculatePortfolioOptimization(Calculation calculation, InputOutputBundle ioBundle) {
        matlabUtils.prepareInputForPortfolioOptimization(ioBundle, calculation);
        try {
            portfolioOptimization(calculation, ioBundle);

        } catch (MatlabException me) {
            log.info("ioBundle after error:\n{}", ioBundle);
            throw me;
        } catch (Exception e) {
            log.info("ioBundle after error:\n{}", ioBundle);
            throw new SPAInternalApplicationException("Error while optimizing portfolios", e);
        }
        // efficientPortfolioUsers fill
        portfolioUtils.setPortfolios(ioBundle, calculation);
    }

    private AbstractAssetClassGroup findRootAsset(AbstractAssetClassGroup assetClassGroup) {
        if (assetClassGroup.getParent() == null)
            return assetClassGroup;

        return findRootAsset(assetClassGroup.getParent());
    }

    private List<double[]> findReturnsForRelatedAssets(Set<String> relatedAssets, Set<Map.Entry<String, Integer>> returnFiltered, InputOutputBundle ioBundle) {
        List<double[]> ret = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : returnFiltered) {
            if (relatedAssets.contains(entry.getKey())) {
                ret.add(ioBundle.getRfReturnsMat()[entry.getValue()]);
            }
        }

        return ret;
    }

    private void findAllChildAssets(AssetClassGroup assetClassGroup, Set<String> relatedAssets) {
        if (assetClassGroup.getSubGroups() == null || assetClassGroup.getSubGroups().isEmpty())
            return;

        for (AssetClassGroup asset : assetClassGroup.getSubGroups()) {
            relatedAssets.add(asset.getName());
            findAllChildAssets(asset, relatedAssets);
        }
    }

    private Calculation recalculateCalculation( Calculation calculation, InputOutputBundle ioBundle ){

        log.trace( "ioBundle before recalculateCalculation(): \n{}", ioBundle );

        calculatePortfolioOptimization( calculation, ioBundle );

        log.trace( "ioBundle after recalculateCalculation(): \n{}", ioBundle );
        return calculation;
    }

    private double[][] fetchACreturns(Calculation calculation, InputOutputBundle ioBundle) {
        Set<String> assetClassNames = calculation.getAssetClassGroups().stream().map(AbstractAssetClassGroup::getName).collect(Collectors.toSet());
        Set<Map.Entry<String, Integer>> ret = ioBundle.getRfNamesToIndex().entrySet().stream().filter(a -> assetClassNames.contains(a.getKey())).collect(Collectors.toSet());

        Set<String> alreadyProcessedAssets = new HashSet<>();
        List<double[]> acReturns = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : ret) {
            if (!alreadyProcessedAssets.contains(entry.getKey())) {
                Set<String> relatedAssets = new HashSet<>();
                Optional<AssetClassGroup> opt = calculation.getAssetClassGroups().stream().filter(a -> a.getName().equalsIgnoreCase(entry.getKey())).findFirst();
                if (opt.isPresent()) {
                    AssetClassGroup root = (AssetClassGroup) findRootAsset(opt.get());
                    findAllChildAssets(root, relatedAssets);
                    alreadyProcessedAssets.addAll(relatedAssets);
                    List<double[]> parentReturns = findReturnsForRelatedAssets(relatedAssets, ret, ioBundle);
                    acReturns.add(javaCalculations.columnAverage(parentReturns.toArray(new double[parentReturns.size()][])));
                }
            }
        }

        return acReturns.toArray(new double[acReturns.size()][]);
    }



    private void portfolioOptimization(Calculation calculation, InputOutputBundle ioBundle ) throws Exception{

        double[][] returnsRandom;
        {
            int assets = 58;
            int observations = 1000;
            returnsRandom = new double[assets][];
            Random random = new Random();
            for (int i = 0; i < assets; i++) {
                double[] returns = new double[observations];
                double assetCoef = random.nextDouble() + 1;
                for (int j = 0; j < observations; j++) {
                    returns[j] = (random.nextGaussian() + 0.05) * assetCoef;
                }
                returnsRandom[i] = returns;
            }
        }

        PortfolioOptimizationOutput portfolioOptimizationOutput = javaCalculations.portfolioOptimization( returnsRandom, ioBundle.getAllocConstraintIneqCoefMat(), ioBundle.getAllocConstraintIneqConstVec());

        portfolioOptimizationOutput.setEfficientPortfoliosIsMat( portfolioOptimizationOutput.getEfficientPortfoliosMat() );
        portfolioOptimizationOutput.setEfficientPortfoliosMarketMat( portfolioOptimizationOutput.getEfficientPortfoliosMat() );
        portfolioOptimizationOutput.setEfficientsReturnsIsVec( portfolioOptimizationOutput.getEfficientsReturnsVec() );
        portfolioOptimizationOutput.setEfficientsReturnsMarketVec( portfolioOptimizationOutput.getEfficientsReturnsVec() );
        portfolioOptimizationOutput.setTrackingErrorsIsVec( portfolioOptimizationOutput.getTrackingErrorsVec() );
        portfolioOptimizationOutput.setTrackingErrorsMarketVec( portfolioOptimizationOutput.getTrackingErrorsVec() );

        ioBundle.setEfficientPortfoliosMat( portfolioOptimizationOutput.getEfficientPortfoliosMat() );
        ioBundle.setEfficientsReturnsVec( portfolioOptimizationOutput.getEfficientsReturnsVec() );
        ioBundle.setTrackingErrorsVec( portfolioOptimizationOutput.getTrackingErrorsVec() );
        ioBundle.setEfficientPortfoliosIsMat( portfolioOptimizationOutput.getEfficientPortfoliosIsMat() );
        ioBundle.setEfficientsReturnsIsVec( portfolioOptimizationOutput.getEfficientsReturnsIsVec() );
        ioBundle.setTrackingErrorsIsVec( portfolioOptimizationOutput.getTrackingErrorsIsVec() );
        ioBundle.setEfficientPortfoliosMarketMat( portfolioOptimizationOutput.getEfficientPortfoliosMarketMat() );
        ioBundle.setEfficientsReturnsMarketVec( portfolioOptimizationOutput.getEfficientsReturnsMarketVec() );
        ioBundle.setTrackingErrorsMarketVec( portfolioOptimizationOutput.getTrackingErrorsMarketVec() );

    }


    public List<PortfolioDto> updateCalculation( Long calculationId, List<AllocationConstraintDto> allocationConstraints ){

        Calculation calculation = findCalculationById( calculationId );
        if ( calculation == null )
            throw new SPAInternalApplicationException( "Unable to find calculation with ID " + calculationId );

        if ( calculation.isReadOnly() ) {
            throw new SPAInternalApplicationException( "Calculation is read only, " + calculationId );
        }

        InputOutputBundle ioBundle = calculation.getIoBundle( calculationMapper );
        if ( ioBundle == null )
            throw new SPAInternalApplicationException( "Unable to get InputOutputBundle for calculation ID " + calculationId );

        AllocationConstraintService.updateAllocationConstraints(
                calculation.getAllocationConstraints(), allocationConstraints );

        // portfolio optimization
        recalculateCalculation( calculation, ioBundle );

        calculationDao.save( calculation );

        return calculationMapper.mapCalculationToPortfolioDtoList( calculation ).getEfficientPortfoliosUser();
    }

    public List<PortfolioDto> applyCalculation( Long calculationId, List<AllocationConstraintDto> allocationConstraints ){
        return  updateCalculation( calculationId, allocationConstraints );
    }

    public void setSrLibEnabled( Boolean srLibEnabled ){
        this.srLibEnabled = srLibEnabled;
    }
}

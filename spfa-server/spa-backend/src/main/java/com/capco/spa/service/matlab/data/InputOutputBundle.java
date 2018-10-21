package com.capco.spa.service.matlab.data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.capco.spa.jpa.entity.AssetClass;
import com.capco.spa.utils.FormatUtil;
import com.capco.spa.utils.GeneralUtils;
import com.capco.spa.utils.OutputUtils;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * Holder for all matlab calculation inputs and outputs.
 * If you want to preserve a field after calculation creation and persist it,
 * you need to define the field also in com.capco.spa.service.dto.IOBundleJson. It's mapped automatically.
 * <p>
 * Created by Stefan Linner on 7. 6. 2017.
 */
@SuppressWarnings( "MismatchedReadAndWriteOfArray" )
@Slf4j
@Getter
@Setter
public final class InputOutputBundle implements Serializable{

    // helpers
    /**
     * Order of this list of risk factor names is an essential ordering for all matrix constructions.
     * Set of risk factors in this variable is retrieved from Avalon sensitivities and time series (RF levels).
     */
    private ArrayList<String> rfNamesFromIndex;
    /**
     * Map from Risk factor name to index of rfNamesFromIndex. Constructed automatically from rfNamesFromIndex.
     */
    private HashMap<String,Integer> rfNamesToIndex;
    /**
     * Key = currency, Value = rfNamesFromIndex filtered only for KRD RFs and the given currency.
     * rfNamesFromIndex order must be compliant with targetDv01 time frame buckets order
     */
    private HashMap<String,ArrayList<String>> rfNamesCurrencyKrdFromIndex;


    /**
     * Order of this list of asset class names is an essential ordering for all matrix constructions.
     */
    private ArrayList<String> acNamesFromIndex;

    /**
     * Map from Asset class name to index of acNamesFromIndex
     */
    private HashMap<String,Integer> acNamesToIndex;

    /**
     * Map from Asset class name to index of acNamesFromIndex
     */
    private HashMap<String,BigDecimal> acNamesToScaleFactor;
    /**
     * Used in rfReducedSensitivityCorpMatMap
     */
    private Map<String,ArrayList<String>> acNamesCorporateCurrencyMap;
    private Map<String,ArrayList<String>> acNamesNonCorporateCurrencyMap;
    /**
     * Used in rfReducedSensitivityNonCorpMatMap and in nonCorporateLiabilities calculation
     */
    private Map<String,ArrayList<String>> acNamesNonCorporateMatlabCurrencyMap;

    private List<String> rfTypeList = new ArrayList<>(  );

    /**
     * Risk factor levels. Rows represent risk factors, columns represent weeks.
     */
    private double[][] timeSeriesMat = new double[0][];

    /**
     * [rfNamesToIndex or rfNamesFromIndex][acNamesToIndex or acNamesFromIndex]
     */
    private double[][] rfSensitivitiesMat = new double[0][];

    /**
     * Key = currency,
     * Value = reduced sensitivity matrix for corporate ACs (except FIGOV / FIKRD) and FIKRD RFs for the given currency
     * order and position: [rfNamesCurrencyKrdFromIndexMap][acNamesCorporateCurrencyMap],
     *                      rfNamesCurrencyKrdFromIndexMap order must be the same as order of time frame buckets in targetDv01
     */
    private HashMap<String,ArrayList<ArrayList<Double>>> rfReducedSensitivityCorpMatMap;
    /**
     * Key = currency,
     * Value = reduced sensitivity matrix for non-corporate ACs (FIGOV / FIKRD) and FIKRD RFs for the given currency
     * order and position: [rfNamesCurrencyKrdFromIndexMap][acNamesNonCorporateCurrencyMap]
     *                      rfNamesCurrencyKrdFromIndexMap order must be the same as order of time frame buckets in targetDv01
     */
    private HashMap<String,ArrayList<ArrayList<Double>>> rfReducedSensitivityNonCorpMatMap;

    private double[] rfP1Vec = new double[0];
    /**
     * This rfP4Vec is from exposures. There can be also from sensitivities.
     * From exposures was previously used for the contribution to risk computation.
     * Now we always use a new one, calculated from sensitivities.
     */
    private double[] rfP4Vec = new double[0];

    /**
     * Key = currency,
     * Value = dv01 time frames, e.i. TimeFrameEnum.values()
     *          value order must be compliant with rfNamesCurrencyKrdFromIndexMap order
     * For more info see SPA-21.
     */
    private HashMap<String,ArrayList<Double>> targetDv01Map;
    /**
     * Key = currency,
     * Value = p4NavSum - p1NavCurrencyNonCorporateSum
     */
    private HashMap<String,Double> nonCorporateConstraintsMap;

    private double p1sum;
    private double p4sum;

    private double[] acP4Vec;
    private double[] weightsP1 = new double[0];
    private double[] weightsP1UDef = new double[0];
    private double[] weightsP4 = new double[0];
    private double[] weightsP4UDef = new double[0];

    private double netDv01Sum;
    private HashMap<String,Double> acNetDv01Map;

    /**
     * quadprog argument 'A' - Ineqaulity allocation constraint coefficients
     */
    private double[][] allocConstraintIneqCoefMat = new double[0][];
    /**
     * quadprog argument 'b' - Ineqaulity allocation constraint constants
     */
    private double[] allocConstraintIneqConstVec = new double[0];
    /**
     * quadprog argument 'Aeq' - Eqaulity allocation constraint coefficients
     */
    private double[][] allocConstraintEqCoefMat = new double[0][];
    /**
     * quadprog argument 'beq' - Eqaulity allocation constraint constants
     */
    private double[] allocConstraintEqConstVec = new double[0];

    private double[] acExcessReturnsVec = new double[0];
    private double[] acProspectiveReturnsVec = new double[0];
    private double[] acProspectiveReturnsMarketVec = new double[0];
    private double[] acProspectiveInvestmentReturnsVec = new double[0];

    // outputs
    private double[][] rfReturnsMat = new double[0][];
    private double[][] rfCovarianceMat = new double[0][];
    private double[][] rfCovarianceMatUdef = new double[0][];
    private double[][] rfCorrelationMat = new double[0][];
    private double[] rfVolatilityVec = new double[0];
    private double[] rfContributionToRiskVec = new double[0];
    private double[] acContributionToRiskVec = new double[0];
    private double[][] acCovarianceMat = new double[0][];
    private double[][] acCovarianceMarketMat = new double[0][];
    private double[][] acCorrelationMat = new double[0][];
    private double[] acVolatilityVec = new double[0];
    private double[][] efficientPortfoliosMat = new double[0][];
    private double[] efficientsReturnsVec = new double[0];
    private double[] trackingErrorsVec = new double[0];
    private double[][] efficientPortfoliosIsMat = new double[0][];
    private double[] efficientsReturnsIsVec = new double[0];
    private double[] trackingErrorsIsVec = new double[0];
    private double[][] efficientPortfoliosMarketMat = new double[0][];
    private double[] efficientsReturnsMarketVec = new double[0];
    private double[] trackingErrorsMarketVec = new double[0];
    private double[][] efCtr = new double[0][];
    private double[][] efCtrIs = new double[0][];
    private double[][] efCtrMarket = new double[0][];
    private double[] ctrUDef = new double[0];

    /**
     * Key = currency,
     * Value = FIGOV and FIKRD ACs for the given currency.
     * Order and indexing is given by the acP1CurrencyCorporateExposuresMap.aggregatedAcNames
     */
    private HashMap<String,ArrayList<Double>> nonCorporateLiabilitiesVecMap = new HashMap<>();
    /**
     * P1 current portfolio liabilities for all ACs. For non-corporate are calculated, for corporate are from Avalon.
     * Index: acNamesFromIndex / acNamesToIndex
     */
    private double[] acLiabilities = new double[0];
    /**
     * P1 user-definedliabilities (liablities chart) for all ACs.
     * Index: acNamesFromIndex / acNamesToIndex
     */
    private double[] acLiabilitiesUDef = new double[0];

    /**
     * Duration constraint coefficients for the portfolio optimization
     */
    private double[] acDurations = new double[0];

    public void setRiskFactorNames( Collection<String> riskFactorNames ){

        rfNamesToIndex = new HashMap<>();
        rfNamesFromIndex = new ArrayList<>();

        riskFactorNames.forEach( rfn -> {

            rfNamesToIndex.put( rfn, rfNamesFromIndex.size() );
            rfNamesFromIndex.add( rfn );
        } );
    }

    public boolean existsRiskFactorWithName( String rfName ){

        return rfNamesToIndex.containsKey( rfName );
    }

    public void setAssetClasses( Collection<AssetClass> assetClasses ){

        acNamesToIndex = new HashMap<>();
        acNamesToScaleFactor = new HashMap<>();
        acNamesFromIndex = new ArrayList<>();

        assetClasses.forEach( ac -> {

            acNamesToIndex.put( ac.getName(), acNamesFromIndex.size() );
            acNamesFromIndex.add( ac.getName() );
            acNamesToScaleFactor.put( ac.getName(), ac.getScaleFactor() );
        } );
    }

    public BigDecimal getACScaleFactor( String acName ){
        BigDecimal scaleFactor = acNamesToScaleFactor.get( acName );
        if ( scaleFactor == null ) {
            scaleFactor = BigDecimal.ONE;
        }
        return scaleFactor;
    }

    public boolean existsAssetClassWithName( String acName ){

        return acNamesToIndex.containsKey( acName );
    }

    public int getAcSize(){
        return acNamesFromIndex != null ? acNamesFromIndex.size() : 0;
    }

    public int getRfSize(){
        return rfNamesFromIndex != null ? rfNamesFromIndex.size() : 0;
    }

    public double getACVolatility( String acName ){
        return this.acVolatilityVec[acNamesToIndex.get( acName )];
    }

    public double getACLiability( String acName ){
        return this.acLiabilities[acNamesToIndex.get( acName )];
    }

    public double getACReturn( String acName ){
        return this.acExcessReturnsVec[acNamesToIndex.get( acName )];
    }

    public void setRfVolatilityVec( double[] rfVolatilityVec ){
        this.rfVolatilityVec = Arrays.stream(rfVolatilityVec).map( volatility -> FormatUtil.scaleDouble( volatility ) ).toArray();
    }

    @Override
    public String toString(){
        String output = getBasicOutput();

        String trace = "TRACE OUTPUT:\n";
        if ( log.isTraceEnabled() ) {
            trace += getExtendedOutput();
        } else {
            trace += "For the complete output, set the logger level to TRACE...\n";
        }

        output += trace;
        return output;

    }

    public String getExportOutput(){
        return
                "acNamesFromIndex:\n" +
                        OutputUtils.vectorOfStringToString( this.getAcNamesFromIndex() ) +
                        "\n\n" +
                        "rfNamesFromIndex:\n" +
                        OutputUtils.vectorOfStringToString( this.getRfNamesFromIndex() ) +
                        "acLiabilities:\n" +
                        OutputUtils.vectorToString( this.getAcLiabilities(), true ) +
                        "\n\n" +
                        "acLiabilitiesUDef:\n" +
                        OutputUtils.vectorToString( this.getAcLiabilitiesUDef(), true ) +
                        "\n\n" +
                        "acDurations:\n" +
                        OutputUtils.vectorToString( this.getAcDurations(), true ) +
                        "\n\n" +
                        "weightsP1:\n" +
                        OutputUtils.vectorToString( this.getWeightsP1(), true ) +
                        "\n\n" +
                        "weightsP1UDef:\n" +
                        OutputUtils.vectorToString( this.getWeightsP1UDef(), true ) +
                        "\n\n" +
                        "weightsP4:\n" +
                        OutputUtils.vectorToString( this.getWeightsP4(), true ) +
                        "\n\n" +
                        "weightsP4UDef:\n" +
                        OutputUtils.vectorToString( this.getWeightsP4UDef(), true ) +
                        "\n\n" +
                        "allocConstraintIneqConstVec:\n" +
                        OutputUtils.vectorToString( this.getAllocConstraintIneqConstVec(), true ) +
                        "\n\n" +
                        "allocConstraintEqCoefMat:\n" +
                        OutputUtils.matrixToString( this.getAllocConstraintEqCoefMat(), true ) +
                        "\n\n" +
                        "allocConstraintEqConstVec:\n" +
                        OutputUtils.vectorToString( this.getAllocConstraintEqConstVec(), true ) +
                        "\n\n" +
                        "acExcessReturnsVec:\n" +
                        OutputUtils.vectorToString( this.getAcExcessReturnsVec(), true ) +
                        "\n\n" +
                        "acProspectiveReturnsVec:\n" +
                        OutputUtils.vectorToString( this.getAcProspectiveReturnsVec(), true ) +
                        "\n\n" +
                        "acProspectiveReturnsMarketVec:\n" +
                        OutputUtils.vectorToString( this.getAcProspectiveReturnsMarketVec(), true ) +
                        "\n\n" +
                        "acProspectiveInvestmentReturnsVec:\n" +
                        OutputUtils.vectorToString( this.getAcProspectiveInvestmentReturnsVec(), true ) +
                        "\n\n" +
                        "Risk factor covariance matrix based on non-scaled market time serie\n" +
                        "rfCovarianceMat:\n" +
                        OutputUtils.matrixToString( this.getRfCovarianceMat(), true ) +
                        "\n\n" +
                        "Risk factor covariance matrix based on scaled (e.g real estate) volatilities and user defined volatilites\n" +
                        "rfCovarianceMatUdef:\n" +
                        OutputUtils.matrixToString( this.getRfCovarianceMatUdef(), true ) +
                        "\n\n" +
                        "rfCorrelationMat:\n" +
                        OutputUtils.matrixToString( this.getRfCorrelationMat(), true ) +
                        "\n\n" +
                        "rfSensitivitiesMat:\n" +
                        OutputUtils.matrixToString( this.getRfSensitivitiesMat(), true ) +
                        "\n\n" +
                        "acCovarianceMat:\n" +
                        OutputUtils.matrixToString( this.getAcCovarianceMat(), true ) +
                        "\n\n" +
                        "acCovarianceMarketMat:\n" +
                        OutputUtils.matrixToString( this.getAcCovarianceMarketMat(), true ) +
                        "\n\n" +
                        "acCorrelationMat:\n" +
                        OutputUtils.matrixToString( this.getAcCorrelationMat(), true ) +
                        "\n\n" +
                        "allocConstraintIneqCoefMat:\n" +
                        OutputUtils.matrixToString( this.getAllocConstraintIneqCoefMat(), true ) +
                        "\n\n" +
                        "rfP1Vec:\n" +
                        OutputUtils.vectorToString( this.getRfP1Vec(), true ) +
                        "\n\n" +
                        "rfP4Vec:\n" +
                        OutputUtils.vectorToString( this.getRfP4Vec(), true ) +
                        "\n\n"+
                        "rfVolatilityVec:\n" +
                        OutputUtils.vectorToString( this.getRfVolatilityVec(), true ) +
                        "\n\n" ;
    }


    public String getBasicOutput(){
        Set<String> currencySet = this.getAcNamesNonCorporateCurrencyMap() != null ?
                this.getAcNamesNonCorporateCurrencyMap().keySet() : null;

        String output = "acNamesFromIndex:\n" +
                OutputUtils.vectorOfStringToString( this.getAcNamesFromIndex() ) +
                "\n\n" +
                "acNamesCorporateCurrencyMap:\n" +
                OutputUtils.vectorOfStringToString( this.getAcNamesCorporateCurrencyMap() ) +
                "\n\n" +
                "acNamesNonCorporateCurrencyMap:\n" +
                OutputUtils.vectorOfStringToString( this.getAcNamesNonCorporateCurrencyMap() ) +
                "\n\n" +
                "acNamesNonCorporateMatlabCurrencyMap:\n" +
                OutputUtils.vectorOfStringToString( this.getAcNamesNonCorporateMatlabCurrencyMap() ) +
                "\n\n" +
                "rfNamesFromIndex:\n" +
                OutputUtils.vectorOfStringToString( this.getRfNamesFromIndex() ) +
                "\n\n" +
                "rfNamesCurrencyKrdFromIndex:\n" +
                OutputUtils.vectorOfStringToString( this.getRfNamesCurrencyKrdFromIndex() ) +
                "\n\n" +
                "rfVolatilityVec:\n" +
                OutputUtils.vectorToString( this.getRfVolatilityVec() ) +
                "\n\n" +
                "rfP1Vec:\n" +
                OutputUtils.vectorToString( this.getRfP1Vec() ) +
                "\n\n" +
                "rfP4Vec:\n" +
                OutputUtils.vectorToString( this.getRfP4Vec() ) +
                "\n\n" +
                "rfContributionToRiskVec:\n" +
                OutputUtils.vectorToString( this.getRfContributionToRiskVec() ) +
                "\n\n" +
                "acContributionToRiskVec (sum = " + GeneralUtils.getSum( this.getAcContributionToRiskVec() ) + "):\n" +
                OutputUtils.vectorToString( this.getAcContributionToRiskVec() ) +
                "\n\n" +
                "rfReducedSensitivitiesCorpMat:\n" +
                OutputUtils.matrixToString( this.getRfReducedSensitivityCorpMatMap() ) +
                "\n\n" +
                "rfReducedSensitivitiesNonCorpsMat:\n" +
                OutputUtils.matrixToString( this.getRfReducedSensitivityNonCorpMatMap() ) +
                "\n\n" +
                "acVolatilityVec:\n" +
                OutputUtils.vectorToString( this.getAcVolatilityVec() ) +
                "\n\n" +
                "liability currency list:\n" +
                OutputUtils.vectorOfStringToString( currencySet ) +
                "\n\n" +
                "targetDv01Map:\n" +
                OutputUtils.vectorToString( this.getTargetDv01Map() ) +
                "\n\n" +
                "nonCorporateConstraintsMap:\n" +
                this.getNonCorporateConstraintsMap() +
                "\n\n" +
                "acNonCorporateLiabilitiesVec:\n" +
                OutputUtils.vectorToString( this.getNonCorporateLiabilitiesVecMap() ) +
                "\n\n" +
                "acLiabilities:\n" +
                OutputUtils.vectorToString( this.getAcLiabilities() ) +
                "\n\n" +
                "acLiabilitiesUDef:\n" +
                OutputUtils.vectorToString( this.getAcLiabilitiesUDef() ) +
                "\n\n" +
                "acDurations:\n" +
                OutputUtils.vectorToString( this.getAcDurations() ) +
                "\n\n" +
                "weightsP1:\n" +
                OutputUtils.vectorToString( this.getWeightsP1() ) +
                "\n\n" +
                "weightsP1UDef:\n" +
                OutputUtils.vectorToString( this.getWeightsP1UDef() ) +
                "\n\n" +
                "weightsP4:\n" +
                OutputUtils.vectorToString( this.getWeightsP4() ) +
                "\n\n" +
                "weightsP4UDef:\n" +
                OutputUtils.vectorToString( this.getWeightsP4UDef() ) +
                "\n\n" +
                "allocConstraintIneqConstVec:\n" +
                OutputUtils.vectorToString( this.getAllocConstraintIneqConstVec() ) +
                "\n\n" +
                "allocConstraintEqCoefMat:\n" +
                OutputUtils.matrixToString( this.getAllocConstraintEqCoefMat() ) +
                "\n\n" +
                "allocConstraintEqConstVec:\n" +
                OutputUtils.vectorToString( this.getAllocConstraintEqConstVec() ) +
                "\n\n" +
                "acExcessReturnsVec:\n" +
                OutputUtils.vectorToString( this.getAcExcessReturnsVec() ) +
                "\n\n" +
                "acProspectiveReturnsVec:\n" +
                OutputUtils.vectorToString( this.getAcProspectiveReturnsVec() ) +
                "\n\n" +
                "acProspectiveReturnsMarketVec:\n" +
                OutputUtils.vectorToString( this.getAcProspectiveReturnsMarketVec() ) +
                "\n\n" +
                "acProspectiveInvestmentReturnsVec:\n" +
                OutputUtils.vectorToString( this.getAcProspectiveInvestmentReturnsVec() ) +
                "\n\n" +
                "efficientPortfoliosMat:\n" +
                OutputUtils.matrixToString( this.getEfficientPortfoliosMat() ) +
                "\n\n" +
                "efficientsReturnsVec:\n" +
                OutputUtils.vectorToString( this.getEfficientsReturnsVec() ) +
                "\n\n" +
                "trackingErrorsVec:\n" +
                OutputUtils.vectorToString( this.getTrackingErrorsVec() ) +
                "\n\n" +
                "efficientPortfoliosIsMat:\n" +
                OutputUtils.matrixToString( this.getEfficientPortfoliosIsMat() ) +
                "\n\n" +
                "efficientsReturnsIsVec:\n" +
                OutputUtils.vectorToString( this.getEfficientsReturnsIsVec() ) +
                "\n\n" +
                "trackingErrorsIsVec:\n" +
                OutputUtils.vectorToString( this.getTrackingErrorsIsVec() ) +
                "\n\n" +
                "efficientPortfoliosMarketMat:\n" +
                OutputUtils.matrixToString( this.getEfficientPortfoliosMarketMat() ) +
                "\n\n" +
                "efficientsReturnsMarketVec:\n" +
                OutputUtils.vectorToString( this.getEfficientsReturnsMarketVec() ) +
                "\n\n" +
                "trackingErrorsMarketVec:\n" +
                OutputUtils.vectorToString( this.getTrackingErrorsMarketVec() ) +
                "\n\n" +
                "efCtr:\n" +
                OutputUtils.matrixToString( this.getEfCtr() ) +
                "\n\n" +
                "efCtrIs:\n" +
                OutputUtils.matrixToString( this.getEfCtrIs() ) +
                "\n\n" +
                "efCtrMarket:\n" +
                OutputUtils.matrixToString( this.getEfCtrMarket() ) +
                "\n\n" +
                "ctrUDef:\n" +
                OutputUtils.vectorToString( this.getCtrUDef() ) +
                "\n\n" +
                "p1sum:\n" +
                this.getP1sum() +
                "\n" +
                "p4sum:\n" +
                this.getP4sum() +
                "\n\n" +
                "netDv01Sum:\n" +
                this.getNetDv01Sum() +
                "\n\n" +
                "acNetDv01Map:\n" +
                OutputUtils.mapToString( this.getAcNetDv01Map() ) +
                "\n\n";

        return output;
    }

    public String getExtendedOutput(){
        return '\n'+
                "timeSeriesMat (risk factor levels):\n" +
                OutputUtils.matrixToString( this.getTimeSeriesMat() ) +
                "\n\n" +
                "rfReturnsMat:\n" +
                OutputUtils.matrixToString( this.getRfReturnsMat() ) +
                "\n\n" +
                "Risk factor covariance matrix based on non-scaled market time serie\n" +
                "rfCovarianceMat:\n" +
                OutputUtils.matrixToString( this.getRfCovarianceMat() ) +
                "\n\n" +
                "Risk factor covariance matrix based on scaled (e.g real estate) volatilities and user defined volatilites\n" +
                "rfCovarianceMatUdef:\n" +
                OutputUtils.matrixToString( this.getRfCovarianceMatUdef(), true ) +
                "\n\n" +
                "rfCorrelationMat:\n" +
                OutputUtils.matrixToString( this.getRfCorrelationMat() ) +
                "\n\n" +
                "rfSensitivitiesMat:\n" +
                OutputUtils.matrixToString( this.getRfSensitivitiesMat() ) +
                "\n\n" +
                "acCovarianceMat:\n" +
                OutputUtils.matrixToString( this.getAcCovarianceMat() ) +
                "\n\n" +
                "acCovarianceMarketMat:\n" +
                OutputUtils.matrixToString( this.getAcCovarianceMarketMat() ) +
                "\n\n" +
                "acCorrelationMat:\n" +
                OutputUtils.matrixToString( this.getAcCorrelationMat() ) +
                "\n\n" +
                "allocConstraintIneqCoefMat:\n" +
                OutputUtils.matrixToString( this.getAllocConstraintIneqCoefMat() ) +
                "\n\n";
    }


}

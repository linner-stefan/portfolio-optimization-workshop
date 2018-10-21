package com.capco.spa.service.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/**
 * Persistable fields of InputOutputBundle.java class
 */
@Data
@JsonIgnoreProperties( ignoreUnknown = true)
public class IOBundleJson implements Serializable{

    private double version;

    @JsonProperty( value = "Asset Class", required = true)  // TODO: annotation can be removed at the earliest convenience, it only wrongly renames rfNamesFromIndex to "Asset Class"
    private ArrayList<String> rfNamesFromIndex;
    private HashMap<String,Integer> rfNamesToIndex;

    private ArrayList<String> acNamesFromIndex;
    private HashMap<String, Integer> acNamesToIndex;

    //get rid of it, useless
    private double[][] timeSeriesMat = new double[0][];

    private double[][] rfSensitivitiesMat = new double[0][];

    private double[] rfP1Vec = new double[0];
    private double[] rfP4Vec = new double[0];

    private double p1sum;
    private double p4sum;
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

    private HashMap<String,ArrayList<Double>> nonCorporateLiabilitiesVecMap = new HashMap<>();

    private double[] acLiabilities = new double[0];
    private double[] acDurations = new double[0];


}

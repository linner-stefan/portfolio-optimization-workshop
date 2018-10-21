package com.capco.spa.service.matlab.data;

import java.math.BigDecimal;
import java.util.Map;

import com.capco.spa.utils.MatlabUtils;
import com.capco.spa.utils.OutputUtils;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PortfolioOptimizationOutput {

    private double[][] efficientPortfoliosMat;
    private double[][] efficientPortfoliosIsMat;
    private double[][] efficientPortfoliosMarketMat;
    private double[] efficientsReturnsVec;
    private double[] efficientsReturnsIsVec;
    private double[] efficientsReturnsMarketVec;
    private double[] trackingErrorsVec;
    private double[] trackingErrorsIsVec;
    private double[] trackingErrorsMarketVec;

    public PortfolioOptimizationOutput(){
    }

    @Override
    public String toString(){
        String output =
                        "efficientPortfoliosMat:\n" +
                        OutputUtils.matrixToString( this.efficientPortfoliosMat ) +
                        "\n\n" +
                        "efficientPortfoliosIsMat:\n" +
                        OutputUtils.matrixToString( this.efficientPortfoliosIsMat ) +
                        "\n\n"+
                        "efficientPortfoliosMarketMat:\n" +
                        OutputUtils.matrixToString( this.efficientPortfoliosMarketMat ) +
                        "\n\n"+
                        "efficientsReturnsVec:\n" +
                        OutputUtils.vectorToString( this.efficientsReturnsVec ) +
                        "\n\n"+
                        "efficientsReturnsIsVec:\n" +
                        OutputUtils.vectorToString( this.efficientsReturnsIsVec ) +
                        "\n\n"+
                        "efficientsReturnsMarketVec:\n" +
                        OutputUtils.vectorToString( this.efficientsReturnsMarketVec ) +
                        "\n\n"+
                        "trackingErrorsVec:\n" +
                        OutputUtils.vectorToString( this.trackingErrorsVec ) +
                        "\n\n"+
                        "trackingErrorsIsVec:\n" +
                        OutputUtils.vectorToString( this.trackingErrorsIsVec ) +
                        "\n\n"+
                        "trackingErrorsMarketVec:\n" +
                        OutputUtils.vectorToString( this.trackingErrorsMarketVec ) +
                        "\n\n";

        return output;

    }
}

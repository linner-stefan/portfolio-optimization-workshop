package com.capco.spa.service.matlab.data;

import com.capco.spa.utils.OutputUtils;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PortfolioOptimizationSimpleOutput {

    private double[][] efficientPortfoliosMat;

    private double[] efficientsReturnsVec;

    private double[] trackingErrorsVec;


    public PortfolioOptimizationSimpleOutput(){
    }



    @Override
    public String toString(){

        return "efficientPortfoliosMat:\n" +
        OutputUtils.matrixToString( this.efficientPortfoliosMat ) +
        "\n\n"+
        "efficientsReturnsVec:\n" +
        OutputUtils.vectorToString( this.efficientsReturnsVec ) +
        "\n\n"+
        "trackingErrorsVec:\n" +
        OutputUtils.vectorToString( this.trackingErrorsVec ) +
        "\n\n";

    }
}

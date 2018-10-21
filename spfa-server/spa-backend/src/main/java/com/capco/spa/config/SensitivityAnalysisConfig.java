package com.capco.spa.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


/**
 * Created by Stefan Linner on 12. 9. 2017.
 */
@Component
public class SensitivityAnalysisConfig {

    private Double rangeOthers;
    private Double stepSizeOthers;
    private Double rangeEq;
    private Double stepSizeEq;

    @Value("${spa.sensitivityAnalysis.range.others:}")
    public void setRangeOthers( Double rangeOthers ){
        this.rangeOthers = rangeOthers;
    }

    @Value("${spa.sensitivityAnalysis.stepSize.others:}")
    public void setStepSizeOthers( Double stepSizeOthers ){
        this.stepSizeOthers = stepSizeOthers;
    }

    @Value("${spa.sensitivityAnalysis.range.eq:}")
    public void setRangeEq( Double rangeEq ){
        this.rangeEq = rangeEq;
    }

    @Value("${spa.sensitivityAnalysis.stepSize.eq:}")
    public void setStepSizeEq( Double stepSizeEq ){
        this.stepSizeEq = stepSizeEq;
    }

}

package com.capco.spa.service.exception;

public class SPAReadOnlyCalculationException extends SPAInternalApplicationException {

    public SPAReadOnlyCalculationException( Long calculationId ){
        super( "Calculation is readOnly "  + calculationId);
    }

}

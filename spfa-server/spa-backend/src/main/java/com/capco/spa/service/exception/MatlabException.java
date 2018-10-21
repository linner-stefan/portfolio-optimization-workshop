package com.capco.spa.service.exception;

/**
 * Created by Stefan Linner on 14/09/2017.
 */
public class MatlabException extends RuntimeException {

    public MatlabException( String message ){
        super( message );
    }

    public MatlabException( String message, Throwable cause ){
        super( message, cause );
    }
}

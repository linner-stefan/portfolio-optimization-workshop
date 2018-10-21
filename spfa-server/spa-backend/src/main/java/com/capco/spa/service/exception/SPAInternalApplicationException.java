package com.capco.spa.service.exception;

public class SPAInternalApplicationException extends RuntimeException {

    public SPAInternalApplicationException( String message ){
        super( message );
    }

    public SPAInternalApplicationException( String message, Throwable cause ){
        super( message, cause );
    }

    public SPAInternalApplicationException(Throwable cause ){
        super( cause );
    }
}

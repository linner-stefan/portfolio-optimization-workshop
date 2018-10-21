package com.capco.spa.utils;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.capco.spa.service.exception.ExceptionDto;

/**
 * Created by Stefan Linner on 14. 9. 2017.
 */
public final class ResponseUtils {

    public static ResponseEntity buildErrorResponseEntity( Exception ex, HttpStatus httpStatus){

        ExceptionDto exceptionDto  = new ExceptionDto();
        exceptionDto.setMessage( ex.getLocalizedMessage() );
        Throwable rootCause = ExceptionUtils.getRootCause( ex );
        if (rootCause!=null) {
            exceptionDto.setRootCause( ExceptionUtils.getRootCause( ex ).getLocalizedMessage() );
        }
        exceptionDto.setStackTrace( ExceptionUtils.getStackTrace( ex) );

        return ResponseEntity.status( httpStatus ).body( exceptionDto );
    }

    public static ResponseEntity buildErrorResponseEntity( Exception ex){
        return buildErrorResponseEntity( ex, HttpStatus.INTERNAL_SERVER_ERROR );
    }

    public static void setResponseFileInfo(HttpServletResponse response, String fileName, String contentType) {
        response.addHeader("Content-disposition", "attachment;filename="+fileName);
        response.setContentType(contentType);
    }
}

package com.capco.spa.service.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ExceptionDto {

    String message;
    String rootCause;
    String stackTrace;
}

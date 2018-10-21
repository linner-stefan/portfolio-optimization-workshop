package com.capco.spa.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/**
 * Fields of IOBundleJson.java class to be mapped and transferred to FE with CalculationDto.
 *
 * Currently not needed, but the interface is prepared also on FE for future needs.
 */
@Data
@JsonIgnoreProperties( ignoreUnknown = true)
public class IOBundleJsonDto {

    private double version;

}

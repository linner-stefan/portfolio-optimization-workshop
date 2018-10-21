package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.BASIC_PRECISION;
import static com.capco.spa.utils.Constants.BASIC_SCALE;
import static com.capco.spa.utils.Constants.PRECISION;
import static com.capco.spa.utils.Constants.SCALE;
import static com.capco.spa.utils.Constants.SHORT_STRING;

import java.io.Serializable;
import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.MappedSuperclass;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

import com.capco.spa.utils.Constants;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Inheritance( strategy = InheritanceType.TABLE_PER_CLASS )
@MappedSuperclass
@Getter
@Setter
@EqualsAndHashCode( of = "id" )
@ToString( of = { "name" } )
public abstract class AbstractRiskFactor implements Serializable{

    @Column( name = "NAME", nullable = false, updatable = false, length = SHORT_STRING)
    private String name;

    @Column( name = "TYPE", nullable = false, updatable = false, length = SHORT_STRING)
    @Enumerated( EnumType.STRING )
    private AssetClassType type;

    @Column(name = "TOTAL_RETURN", precision = BASIC_PRECISION, scale = BASIC_SCALE, nullable = true, updatable = false)
    private BigDecimal totalReturn;

    //aka starting position
    @Column(name = "ADJUSTED_MARKET_DATA", precision = PRECISION, scale = SCALE, nullable = true, updatable = true)
    @Max( Constants.MAX_VALUE_DEFAULT )
    @Min( Constants.MIN_VALUE_DEFAULT )
    private BigDecimal adjustedMarketData;


}

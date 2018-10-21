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

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@MappedSuperclass
@Getter
@Setter
@EqualsAndHashCode(of = "name")
public abstract class AbstractAssetClass implements Serializable{

    @Column(name = "NAME", nullable = false, updatable = false, length = SHORT_STRING)
    private String name;

    @Column(name = "TYPE", nullable = false, updatable = false, length = SHORT_STRING)
    @Enumerated(EnumType.STRING)
    private AssetClassType type;

    @Column(name = "SCALE_FACTOR", precision = BASIC_PRECISION, scale = BASIC_SCALE, nullable = false, updatable = false)
    private BigDecimal scaleFactor;

    @Column(name = "TOTAL_RETURN", precision = BASIC_PRECISION, scale = BASIC_SCALE, nullable = true, updatable = false)
    private BigDecimal totalReturn;

    @Column(name = "EXPECTED_LOSS", precision = BASIC_PRECISION, scale = BASIC_SCALE, nullable = false, updatable = false)
    private BigDecimal expectedLoss;

    @Column(name = "MARKET_CAP", precision = BASIC_PRECISION, scale = BASIC_SCALE, nullable = false, updatable = false)
    private BigDecimal marketCap;

    @Column(name = "SP_ASSET_RISK_CHARGE", precision = PRECISION, scale = SCALE, nullable = true, updatable = true)
    private BigDecimal spAssetRiskCharge;
}

package com.capco.spa.jpa.entity;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;

import com.capco.spa.jpa.converter.PortfolioLabelConverter;
import com.capco.spa.utils.Constants;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by Stefan Linner on 18. 7. 2017.
 */
@Entity
@Getter
@Setter
@Table( name = "PORTFOLIO"/*,  uniqueConstraints = { @UniqueConstraint( columnNames = { "LABEL", "CALCULATION_FK" } ) }*/ )
public class Portfolio extends AbstractIdEntity {

    @Column( name = "LABEL", nullable = false, updatable = false)
    @Convert(converter = PortfolioLabelConverter.class)
    private PortfolioLabel label;

    @Column( name = "SET_LABEL", nullable = true, updatable = false, length = Constants.SHORT_STRING)
    @Enumerated( EnumType.STRING)
    private PortfolioSetLabel setLabel;

    @OneToMany( mappedBy = "portfolio", cascade = {CascadeType.PERSIST, CascadeType.DETACH, CascadeType.MERGE}, fetch = FetchType.EAGER)
    private Set<PortfolioAllocation> allocations;

    @NotNull
    @Column( name = "PORTFOLIO_RETURN", precision = Constants.ZERO_ONE_PRECISION, scale = Constants.ZERO_ONE_SCALE, nullable = false, updatable = true)
    private BigDecimal portfolioReturn;

    @NotNull
    @Column( name = "TRACKING_ERROR", precision = Constants.ZERO_ONE_PRECISION, scale = Constants.ZERO_ONE_SCALE, nullable = false, updatable = true)
    private BigDecimal trackingError;

    // TODO: use mapstruct or lombok
    public Portfolio clone() {

        Portfolio clone = new Portfolio();

        clone.setLabel( this.getLabel() );
        clone.setSetLabel( this.getSetLabel() );
        clone.setPortfolioReturn( this.getPortfolioReturn() );
        clone.setTrackingError( this.getTrackingError() );

        LinkedHashSet<PortfolioAllocation> allocations = new LinkedHashSet<>();
        this.getAllocations().forEach( pa -> {

            PortfolioAllocation newPa = new PortfolioAllocation();

            newPa.setNavPercentage( pa.getNavPercentage() );
            newPa.setNavTotal( pa.getNavTotal() );
            newPa.setAssetClass( pa.getAssetClass() );

            newPa.setPortfolio( clone );
            allocations.add( newPa );
        } );

        clone.setAllocations( allocations );

        return clone;
    }

}

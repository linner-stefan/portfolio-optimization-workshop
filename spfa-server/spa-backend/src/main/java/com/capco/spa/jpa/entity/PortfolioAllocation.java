package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.BIG_SCALE;
import static com.capco.spa.utils.Constants.ZERO_ONE_SCALE;

import java.io.Serializable;
import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;

import org.hibernate.annotations.DynamicUpdate;

import com.capco.spa.utils.Constants;
import com.capco.spa.utils.FormatUtil;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by Stefan Linner on 18. 7. 2017.
 */
@Entity
@Table( name = "PORTFOLIO_ALLOCATION" )
@Getter
@Setter
@DynamicUpdate
public class PortfolioAllocation implements Serializable{

    @Id
    @GeneratedValue( strategy = GenerationType.SEQUENCE, generator = "PORT_ALLOC_SEQ" )
    @SequenceGenerator( name = "PORT_ALLOC_SEQ", sequenceName = "PORT_ALLOC_SEQ", allocationSize = 100 )
    private Long id;

    @NotNull
    @ManyToOne( fetch = FetchType.LAZY )
    @JoinColumn( name = "PORTFOLIO_FK", nullable = false, updatable = false )
    private Portfolio portfolio;

    @NotNull
    @ManyToOne( fetch = FetchType.LAZY )
    @JoinColumn( name = "ASSET_CLASS_FK", nullable = false, updatable = false )
    private AssetClass assetClass;

    @NotNull
    @Column( name = "NAV_TOTAL", precision = Constants.BIG_PRECISION, scale = BIG_SCALE, nullable = false, updatable = true )
    private BigDecimal navTotal;

    @NotNull
    @Column( name = "NAV_PERCENTAGE", precision = Constants.ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = false, updatable = true )
    private BigDecimal navPercentage;

    @Column( name = "CTR", precision = Constants.ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true, updatable = true )
    private BigDecimal ctr;

    public void setCtr( BigDecimal ctr ){
        this.ctr = FormatUtil.getScaledValue( ctr, ZERO_ONE_SCALE );
    }

    public void setNavPercentage( BigDecimal navPercentage ){
        this.navPercentage = FormatUtil.getScaledValue( navPercentage, ZERO_ONE_SCALE );
        if (this.portfolio!= null && this.portfolio.getLabel()==PortfolioLabel.UserDefined) {
            this.assetClass.setUserDefinedAllocation( this.navPercentage );
        }
    }

    public void setNavTotal( BigDecimal navTotal ){
        this.navTotal = FormatUtil.getScaledValue( navTotal, BIG_SCALE );
    }
}

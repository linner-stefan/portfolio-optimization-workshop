package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.PRECISION;
import static com.capco.spa.utils.Constants.SCALE;
import static com.capco.spa.utils.Constants.ZERO_ONE_SCALE;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.MapsId;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.hibernate.annotations.DynamicUpdate;

import com.capco.spa.utils.Constants;
import com.capco.spa.utils.FormatUtil;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table( name = "ASSET_CLASS" )
@DynamicUpdate
public class AssetClass extends AbstractAssetClass {

    public static final String CASH_AC_NAME_SUFFIX = " Cash and ST Investments";

    @Id
    private Long id;

    @OneToOne
    @MapsId
    private AssetClassGroup assetClassGroup;

    private Boolean selected;

    @Column( name = "DEFINITION_ID", nullable = false, updatable = false )
    private Long definitionId;

    @Column( name = "HISTORIC_RETURN", precision = PRECISION, scale = SCALE, nullable = false )
    private BigDecimal prospectiveReturn;

    @Column( name = "INVESTMENT_VIEW_RETURN", precision = PRECISION, scale = SCALE, nullable = false )
    private BigDecimal investmentViewReturn;

    @Column( name = "EXCESS_RETURN", precision = PRECISION, scale = SCALE, nullable = false )
    private BigDecimal excessReturn;

    @Column( name = "MARKET_RETURN", precision = PRECISION, scale = SCALE, nullable = false )
    private BigDecimal marketReturn;

    @Column( name = "SPREAD_DURATION", precision = PRECISION, scale = SCALE, nullable = false, updatable = false )
    private BigDecimal spreadDuration;

    @Column( name = "OAS", precision = PRECISION, scale = SCALE, nullable = false, updatable = false )
    private BigDecimal oas;

    @Column( name = "YIELD", precision = PRECISION, scale = SCALE, nullable = false, updatable = false )
    private BigDecimal yield;

    @Column( name = "DURATION", precision = PRECISION, scale = SCALE, nullable = false, updatable = false )
    private BigDecimal duration;

    /**
     * Allocation of AC in % for user defined portfolio, duplicate due to auditing purposes (portfolio allocation is not audited)
     */
    @Column( name = "USER_DEFINED_ALLOCATION", precision = Constants.ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true, updatable = true )
    private BigDecimal userDefinedAllocation;

    @OneToMany( mappedBy = "assetClass", fetch = FetchType.LAZY )
    private Set<PortfolioAllocation> portfolioAllocations;


    public void addPortfolioAllocation( PortfolioAllocation portfolioAllocation ){
        if ( this.portfolioAllocations == null ) {
            this.portfolioAllocations = new LinkedHashSet<>();
        }
        this.portfolioAllocations.add( portfolioAllocation );
    }

    public String getCurrency(){
        return getName().substring( 0, 3 );
    }

    @Transient
    private BigDecimal userDefinedMtmImpact;

    @Transient
    private BigDecimal isViewMtmImpact;

}

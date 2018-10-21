package com.capco.spa.jpa.entity;

import com.capco.spa.service.exception.SPAInternalApplicationException;
import com.capco.spa.service.mapper.CalculationMapper;
import com.capco.spa.service.matlab.data.InputOutputBundle;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.capco.spa.utils.Constants.*;

@Entity
@Table( name = "CALCULATION" )
@NamedEntityGraphs( {
        @NamedEntityGraph( name = "allJoins", attributeNodes = {
                @NamedAttributeNode( "userDefinedPortfolio" ),
                @NamedAttributeNode( "currentPortfolio" ),
        } )
} )
@Getter
@Setter
@Slf4j
@EqualsAndHashCode( of = "name" )
public class Calculation implements Serializable {

    public static final String SR_GROUP = "SR Group";

    @Id
    @GeneratedValue( strategy = GenerationType.SEQUENCE, generator = "CALC_SEQ" )
    @SequenceGenerator( name = "CALC_SEQ", sequenceName = "CALC_SEQ", allocationSize = 1 )
    private Long id;

    @Column( name = "NAME", unique = true, nullable = false, updatable = false)
    private String name;

    @Column( name = "DESCRIPTION", nullable = false, updatable = false)
    private String description;

    @OneToMany( cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "calculation" )
    @OrderBy( "itemOrder asc" )
    private List<AssetClassGroup> assetClassGroups;

    @OneToOne( optional = false, cascade = CascadeType.ALL, fetch = FetchType.LAZY )
    @JoinColumn(name = "CALCULATION_BUNDLE_FK", nullable = false, updatable = false)
    protected CalculationBundle calculationBundle;

    @OneToMany( cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinTable(name = "CALC_X_PORT_MARKET",
            joinColumns =
            @JoinColumn(name = "CALC_FK"),
            inverseJoinColumns =
            @JoinColumn(name = "PORT_FK")
    )
    @OrderBy("id")
    private Set<Portfolio> efficientPortfoliosMarket;

    @OneToMany( cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinTable(name = "CALC_X_PORT_USER",
            joinColumns =
            @JoinColumn(name = "CALC_FK"),
            inverseJoinColumns =
            @JoinColumn(name = "PORT_FK")
    )
    @OrderBy("id")
    private Set<Portfolio> efficientPortfoliosUser;

    @OneToMany( cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinTable(name = "CALC_X_PORT_IS",
            joinColumns =
            @JoinColumn(name = "CALC_FK"),
            inverseJoinColumns =
            @JoinColumn(name = "PORT_FK")
    )
    @OrderBy("id")
    private Set<Portfolio> efficientPortfoliosIs;

    @OneToOne( cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinColumn( name = "CURRENT_PORTFOLIO_FK" )
    private Portfolio currentPortfolio;

    @OneToOne( cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true )
    @JoinColumn( name = "USER_DEFINED_PORTFOLIO_FK" )
    private Portfolio userDefinedPortfolio;

    @Column( name = "READONLY", nullable = false)
    private boolean readOnly = false;

    @Transient
    private LinkedHashMap<String,AssetClass> assetClassMap;

    /**
     * This field differs from this.calculationBundle.ioBundleJson or ioBundleString.
     * CalculationBundle is used only for persistence purposes, this ioBundle field represents an usable object instance.
     */
    @Transient
    private InputOutputBundle ioBundle;
    /**
     * For IOBundleJson mappings
     */
    @Transient
    private transient CalculationMapper calculationMapper;

    public Collection<AllocationConstraint> getAllocationConstraints(){

        if ( assetClassGroups != null )
            return assetClassGroups.stream()
                    .map( acg -> acg.getAllocationConstraint() )
                    .collect( Collectors.toList() );

        return null;
    }

    public void setAssetClassGroups( List<AssetClassGroup> assetClassGroups ){

        this.assetClassGroups = assetClassGroups;
        assetClassGroups.forEach( acg -> acg.setCalculation( this ) );

        this.setAssetClassMap(assetClassMap());
    }

    private LinkedHashMap<String, AssetClass> assetClassMap() {
        return this.assetClassGroups.stream()
                .filter(acg -> acg.getAssetClass() != null)
                .map(AssetClassGroup::getAssetClass)
                .collect(Collectors.toMap(
                        AbstractAssetClass::getName,
                        ac -> ac,
                        (u, v) -> {
                            throw new IllegalStateException(String.format("Duplicate key %s", u));
                        },
                        LinkedHashMap::new));
    }

    private void setAssetClassMap( LinkedHashMap<String,AssetClass> assetClassMap ){
        this.assetClassMap = assetClassMap;
    }

    @PrePersist
    @PreUpdate
    private void serializeIoBundle(){
        if ( this.ioBundle == null || this.calculationMapper == null ){
            log.debug( "No InputOutputBundle or CalculationMapper in Calculation instance. No need to serialize InputOutputBundle to IOBundleJson." );
            return;
        }
        if ( this.calculationBundle == null ) {
            this.calculationBundle = new CalculationBundle();
        }
        this.calculationBundle.setIoBundleJson( calculationMapper.mapIOBundleToJson( this.ioBundle ) );
    }

    /**
     * Hidden direct getter.
     * @return
     */
    private InputOutputBundle getIoBundle(){
        return this.ioBundle;
    }

    /**
     * CalculationMapper needs to be set for @PreUpdate serialization to success. Since we are getting ioBundle from calculation,
     * we assume there will be changes to ioBundle, nad @PreUpdate needs to be called.
     *
     * @param calculationMapper helps with deserialization
     * @return
     */
    public InputOutputBundle getIoBundle( CalculationMapper calculationMapper ){
        if ( this.ioBundle != null ){
            return this.ioBundle;
        }

        CalculationBundle calculationBundle = this.getCalculationBundle();
        if ( calculationBundle == null ) {
            throw new SPAInternalApplicationException( "CalculationBundle is null for calculation " + this.toString() );
        }

        this.ioBundle = calculationMapper.mapJsonToIOBundle( calculationBundle.getIoBundleJson() );
        this.calculationMapper = calculationMapper;

        return this.ioBundle;
    }

    /**
     * @param ioBundle
     * @param calculationMapper helps with serialization during @PrePersit and @PreUpdate phases
     */
    public void setIoBundle( InputOutputBundle ioBundle, CalculationMapper calculationMapper ){
        this.ioBundle = ioBundle;
        this.calculationMapper = calculationMapper;
    }



}

package com.capco.spa.jpa.entity;

import java.math.BigDecimal;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Stream;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;

import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

import lombok.Getter;
import lombok.Setter;

@Entity
@Table( name = "ASSET_CLASS_GROUP",
        uniqueConstraints = {
                @UniqueConstraint( columnNames = { "NAME", "CALCULATION_FK" } ) } )
@Getter
@Setter
public class AssetClassGroup extends AbstractAssetClassGroup {

    public AssetClassGroup(){
    }

    public AssetClassGroup( Long assetClassGroupDefinitionId ){
        this.definitionId = assetClassGroupDefinitionId;
    }

    @ManyToOne( fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn( name = "PARENT_ID", updatable = false)
    private AssetClassGroup parent;

    @OneToMany( cascade = CascadeType.ALL, mappedBy = "parent")
    @OrderBy( "xorder" )
    @LazyCollection( LazyCollectionOption.TRUE )
    private List<AssetClassGroup> subGroups;

    @OneToOne( fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "assetClassGroup" )
    private AssetClass assetClass;

    @ManyToOne( fetch = FetchType.LAZY, optional = false )
    @JoinColumn( name = "CALCULATION_FK", nullable = false, updatable = false )
    private Calculation calculation;

    @OneToOne( fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "assetClassGroup" )
    private AllocationConstraint allocationConstraint;

    @Column( name = "DEFINITION_ID", nullable = false, updatable = false)
    private Long definitionId;

    @Transient
    private BigDecimal volatility;

    @Override
    public AbstractAssetClassGroup getParent(){
        return parent;
    }

    @Override
    public void setParent( AbstractAssetClassGroup parent ){
        this.parent = (AssetClassGroup) parent;
    }

    public List<AssetClassGroup> getSubGroups(){
        return subGroups;
    }

    public List<AssetClass> extractAssetClasses(){
        List<AssetClass> assetClasses = new LinkedList<>();
        List<AssetClassGroup> subGroups = this.getSubGroups();
        AssetClass assetClass = this.getAssetClass();

        if ( subGroups != null && subGroups.size() > 0 ) {
            subGroups.forEach( group -> assetClasses.addAll( group.extractAssetClasses() ) );
        } else if ( assetClass != null ) {
            assetClasses.add( assetClass );
        }

        return assetClasses;
    }

    public void setParent( AssetClassGroup parent ){
        this.parent = parent;
    }
}

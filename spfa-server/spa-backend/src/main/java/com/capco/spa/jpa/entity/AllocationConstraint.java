package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.ZERO_ONE_PRECISION;
import static com.capco.spa.utils.Constants.ZERO_ONE_SCALE;

import java.io.Serializable;
import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.capco.spa.utils.ZeroOneRange;
import com.capco.spa.utils.FormatUtil;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by E5370259 on 5/15/2017.
 */
@Entity
@Table( name = "ALLOCATION_CONSTRAINT" )
@Getter
@Setter
public class AllocationConstraint implements Serializable{

    @Id
    private Long id;

    @OneToOne
    @MapsId
    private AssetClassGroup assetClassGroup;

    @Column( name = "LOWER_BOUND", precision = ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true, updatable = false )
    @ZeroOneRange
    private BigDecimal lowerBound;
    @Column( name = "ADJUSTED_LOWER_BOUND", precision = ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true )
    @ZeroOneRange
    private BigDecimal adjustedLowerBound;

    @Column( name = "UPPER_BOUND", precision = ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true )
    @ZeroOneRange
    private BigDecimal upperBound;
    @Column( name = "ADJUSTED_UPPER_BOUND", precision = ZERO_ONE_PRECISION, scale = ZERO_ONE_SCALE, nullable = true, updatable = true )
    @ZeroOneRange
    private BigDecimal adjustedUpperBound;

    @Column( name = "AGGREGATION", nullable = false, updatable = false )
    private Boolean aggregation;
    @Column( name = "ADJUSTED_AGGREGATION", nullable = false, updatable = true )
    private Boolean adjustedAggregation;

    @Transient
    private String assetClassGroupName;

    /**
     * Used in the const of constraints calculation to identify constraint that is binding one of its bounds.
     */
    @Transient
    private BindingType binding;

    public enum BindingType {
        LEQ,
        GEQ
    }

    public void adjustUpperBound( BigDecimal lowerBound ){
        if ( lowerBound == null ) {
            return;
        }
        if ( this.lowerBound == null ) {
            this.lowerBound = lowerBound;
            return;
        }
        if ( this.lowerBound.compareTo( lowerBound ) < 0 ) {
            this.lowerBound = lowerBound;
        }
    }

    public void adjustLowerBound( BigDecimal upperBound ){
        if ( upperBound == null ) {
            return;
        }
        if ( this.upperBound == null ) {
            this.upperBound = upperBound;
            return;
        }
        if ( this.upperBound.compareTo( upperBound ) > 0 ) {
            this.upperBound = upperBound;
        }
    }

    public void setAdjustedValues(){
        this.adjustedLowerBound = this.lowerBound;
        this.adjustedUpperBound = this.upperBound;
    }

    public void setAssetClassGroup( AssetClassGroup assetClassGroup ){
        this.assetClassGroup = assetClassGroup;
        this.assetClassGroupName = assetClassGroup.getName();
    }

    public void setLowerBound( BigDecimal lowerBound ){
        this.lowerBound = FormatUtil.getScaledValue( lowerBound, ZERO_ONE_SCALE );
    }

    public void setUpperBound( BigDecimal upperBound ){
        this.upperBound = FormatUtil.getScaledValue( upperBound, ZERO_ONE_SCALE );
        ;
    }

    public void setAdjustedLowerBound( BigDecimal adjustedLowerBound ){
        this.adjustedLowerBound = FormatUtil.getScaledValue( adjustedLowerBound, ZERO_ONE_SCALE );
    }

    public void setAdjustedUpperBound( BigDecimal adjustedUpperBound ){
        this.adjustedUpperBound = FormatUtil.getScaledValue( adjustedUpperBound, ZERO_ONE_SCALE );
    }
}

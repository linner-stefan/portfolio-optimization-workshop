package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.SHORT_STRING;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.MappedSuperclass;
import javax.persistence.SequenceGenerator;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@MappedSuperclass
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Data
@EqualsAndHashCode(of = "name")
@ToString( of = { "id", "name", "level" } )

public abstract class AbstractAssetClassGroup implements Serializable{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ASSET_CLASS_GROUP_SEQ")
    @SequenceGenerator(name = "ASSET_CLASS_GROUP_SEQ", sequenceName = "ASSET_CLASS_GROUP_SEQ", allocationSize = 20)
    private Long id;

    @Column(name = "NAME", nullable = false, updatable = false, length = SHORT_STRING)
    private String name;

    @Column(name = "GROUP_LEVEL", nullable = false, updatable = false)
    private Integer level;

    @Column(name = "XORDER", nullable = false, updatable = false)
    private Integer itemOrder;

    public abstract AbstractAssetClassGroup getParent();

    public abstract void setParent(AbstractAssetClassGroup parent);

    public abstract AbstractAssetClass getAssetClass();
}

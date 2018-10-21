package com.capco.spa.jpa.entity;

import static com.capco.spa.utils.Constants.DEFAULT_SEQUENCER_ALLOCATION_SIZE;
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

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Created by S8GPNK on 21. 6. 2017.
 */
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@MappedSuperclass
@Getter
@Setter
@EqualsAndHashCode(of="id")
@ToString( of = { "id", "name", "level" } )
public abstract class AbstractRiskFactorGroup implements Serializable{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "RISK_FACTOR_GROUP_SEQ")
    @SequenceGenerator(name = "RISK_FACTOR_GROUP_SEQ", sequenceName = "RISK_FACTOR_GROUP_SEQ", allocationSize = DEFAULT_SEQUENCER_ALLOCATION_SIZE)
    private Long id;

    @Column(name = "NAME", nullable = false, updatable = false, length = SHORT_STRING)
    private String name;

    @Column(name = "GROUP_LEVEL", nullable = false, updatable = false)
    private Integer level;

    @Column(name = "XORDER", nullable = false, updatable = false)
    private Integer itemOrder;
}

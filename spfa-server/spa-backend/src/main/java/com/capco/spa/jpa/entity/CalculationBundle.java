package com.capco.spa.jpa.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.PostLoad;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.capco.spa.service.dto.IOBundleJson;
import com.capco.spa.utils.FormatUtil;

import lombok.Getter;
import lombok.Setter;

/**
 * Created by S8GPNK on 13. 7. 2017.
 */

@Entity
@Table( name = "CALCULATION_BUNDLE" )
@Getter
@Setter
public class CalculationBundle implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column( name = "IO_BUNDLE", nullable = false )
    @Lob
    private String ioBundleString;

    @Transient
    private IOBundleJson ioBundleJson;

    public void setIoBundleJson( IOBundleJson ioBundleJson ){
        this.ioBundleJson = ioBundleJson;
        this.ioBundleString = FormatUtil.writeValueAsJsonString( ioBundleJson );
    }

    @PostLoad
    private void deserializeIOBundle(){
        this.ioBundleJson = FormatUtil.readJsonString( ioBundleString, IOBundleJson.class );
    }
}

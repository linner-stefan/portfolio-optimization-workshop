package com.capco.spa.jpa.entity;


import java.io.Serializable;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;

import com.capco.spa.security.SecurityUtils;

import lombok.Getter;

@MappedSuperclass
@Getter
public abstract class AbstractCreatedOnlyEntity implements Serializable{

    @Column( name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column( name = "CREATED_BY", nullable = false, updatable = false)
    private String createdBy;

    @PrePersist
    private void onPersist(){
        this.createdDate = LocalDateTime.now();
        this.createdBy = SecurityUtils.getActiveUserName();
    }

}



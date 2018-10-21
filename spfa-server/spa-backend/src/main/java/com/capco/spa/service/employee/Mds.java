package com.capco.spa.service.employee;

import org.springframework.cache.annotation.Cacheable;

import feign.Param;
import feign.RequestLine;

public interface Mds {

    @RequestLine("GET /employee/{userId}")
    @Cacheable(cacheNames = "mds-employees")
    MdsEmployeeModel getEmployee(@Param("userId") String userId);
}

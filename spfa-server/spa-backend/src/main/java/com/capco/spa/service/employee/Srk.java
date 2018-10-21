package com.capco.spa.service.employee;

import java.util.Map;

import org.springframework.cache.annotation.Cacheable;

import feign.RequestLine;

public interface Srk {

    @RequestLine("GET /updates.json")
    @Cacheable(cacheNames = "srk-photo-updates")
    Map<String, String> getPhotoUpdates();
}

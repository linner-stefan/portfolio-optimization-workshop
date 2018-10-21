package com.capco.spa.service.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String id;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String[] roles;
}

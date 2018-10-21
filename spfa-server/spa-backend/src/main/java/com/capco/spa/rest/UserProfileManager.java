package com.capco.spa.rest;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capco.spa.service.dto.UserProfileDto;
import com.capco.spa.service.employee.Mds;
import com.capco.spa.service.employee.MdsEmployeeModel;
import com.capco.spa.service.employee.Srk;

import feign.FeignException;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import springfox.documentation.annotations.ApiIgnore;

@Slf4j
@RestController
@RequestMapping("api/profile/user")
public class UserProfileManager {

    @Autowired
    Mds mds;

    @GetMapping
    @ApiOperation(value = "Retrieve active user profile")
    public UserProfileDto getUserProfile(@ApiIgnore @AuthenticationPrincipal User activeUser) {
        return getUserProfile("me", activeUser);
    }

    @GetMapping(value = "{userId}")
    @ApiOperation(value = "Retrieve user profile")
    public UserProfileDto getUserProfile(@PathVariable String userId, @ApiIgnore @AuthenticationPrincipal User activeUser) {
        String id = ("me".equalsIgnoreCase(userId) ? activeUser.getUsername() : userId).toUpperCase();
        MdsEmployeeModel employee = getMdsModel(id);

        UserProfileDto userProfile = new UserProfileDto();
        userProfile.setFirstName(employee.getLegalFirstName());
        userProfile.setLastName(employee.getLegalLastName());
        userProfile.setId(id);
        return userProfile;
    }

    private MdsEmployeeModel getMdsModel(String id) {
        MdsEmployeeModel employee = null;
        try {
            employee = this.mds.getEmployee(id);
        } catch (FeignException fe) {
            log.warn("Mds data retrieval failed:" + fe.getMessage());
            log.warn(this.getClass().getName(), "getMdsModel(String):String", fe);
        }
        return employee == null ? new MdsEmployeeModel() : employee;
    }

}

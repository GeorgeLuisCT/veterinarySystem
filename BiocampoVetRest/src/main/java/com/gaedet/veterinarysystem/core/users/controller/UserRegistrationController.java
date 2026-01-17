package com.gaedet.veterinarysystem.core.users.controller;

import com.gaedet.veterinarysystem.core.users.dto.RegisterRequest;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.service.UserRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class UserRegistrationController {

    private final UserRegistrationService userRegistrationService;

    public UserRegistrationController(UserRegistrationService userRegistrationService) {
        this.userRegistrationService = userRegistrationService;
    }

    @PostMapping("/register")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserSummaryResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userRegistrationService.registerUser(request));
    }
}

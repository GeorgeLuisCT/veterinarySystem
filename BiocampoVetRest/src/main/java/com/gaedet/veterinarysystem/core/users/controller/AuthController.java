package com.gaedet.veterinarysystem.core.users.controller;

import com.gaedet.veterinarysystem.core.users.dto.AuthResponse;
import com.gaedet.veterinarysystem.core.branches.dto.BranchSelectionRequest;
import com.gaedet.veterinarysystem.core.users.dto.LoginRequest;
import com.gaedet.veterinarysystem.core.users.dto.TokenUpdateResponse;
import com.gaedet.veterinarysystem.core.users.service.AuthService;
import com.gaedet.veterinarysystem.security.util.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final  JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/select-branch")
    public ResponseEntity<TokenUpdateResponse> selectBranch(@RequestBody BranchSelectionRequest request, @RequestHeader("Authorization") String token) {
        String username = jwtUtils.extractUsername(token.substring(7));
        return ResponseEntity.ok(authService.updateTokenWithBranch(username, request.getBranchId()));
    }
}

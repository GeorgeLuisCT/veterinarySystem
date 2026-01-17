package com.gaedet.veterinarysystem.core.users.service;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.users.dto.AuthResponse;
import com.gaedet.veterinarysystem.core.users.dto.LoginRequest;
import com.gaedet.veterinarysystem.core.users.dto.TokenUpdateResponse;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import com.gaedet.veterinarysystem.security.util.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtUtils jwtUtils, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findAuthBundleByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        var branchResponses = user.getEmployee().getEmployeeBranches().stream()
                .map(eb -> new BranchResponse(
                        eb.getBranch().getId(),
                        eb.getBranch().getName(),
                        eb.getBranch().getLocation()))
                .toList();

        var roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        Long branchId = branchResponses.size() == 1 ? branchResponses.get(0).getId() : null;

        String token = jwtUtils.generateToken(
                user.getId(), user.getEmployee().getId(), user.getUsername(), roles, branchId
        );

        return new AuthResponse(token, branchResponses.size() > 1 ? branchResponses : List.of());
    }

    @Transactional(readOnly = true)
    public TokenUpdateResponse updateTokenWithBranch(String username, Long branchId) {
        User user = userRepository.findAuthBundleByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        var roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        String token = jwtUtils.generateToken(
                user.getId(),
                user.getEmployee().getId(),
                username,
                roles,
                branchId
        );
        return new TokenUpdateResponse(token);
    }
}

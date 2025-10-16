package com.gaedet.biocampovet.core.users.service;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.users.dto.AuthResponse;
import com.gaedet.biocampovet.core.users.dto.LoginRequest;
import com.gaedet.biocampovet.core.users.dto.TokenUpdateResponse;
import com.gaedet.biocampovet.core.users.entity.Role;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import com.gaedet.biocampovet.security.util.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<BranchResponse> branchResponses = user.getEmployee().getEmployeeBranches().stream()
                .map(employeeBranch -> new BranchResponse(
                        employeeBranch.getBranch().getId(),
                        employeeBranch.getBranch().getName(),
                        employeeBranch.getBranch().getLocation()))
                .collect(Collectors.toList());

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());


        String token;
        if (branchResponses.size() == 1) {
            token = jwtUtils.generateToken(
                    user.getId(),
                    user.getEmployee().getId(),
                    user.getUsername(),
                    roles,
                    branchResponses.get(0).getId()
            );
        } else {
            token = jwtUtils.generateToken(
                    user.getId(),
                    user.getEmployee().getId(),
                    user.getUsername(),
                    roles,
                    null
            );
        }
        return new AuthResponse(token, branchResponses.size() > 1 ? branchResponses : Collections.emptyList());
    }

    public TokenUpdateResponse updateTokenWithBranch(String username, Long branchId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        String token = jwtUtils.generateToken(user.getId(), user.getEmployee().getId(), username, roles, branchId);
        return new TokenUpdateResponse(token);
    }
}

package com.gaedet.biocampovet.core.users.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.users.dto.UserInfoResponse;
import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import com.gaedet.biocampovet.core.users.service.UserService;
import com.gaedet.biocampovet.security.annotations.BranchAccessRequired;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    public UserController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @GetMapping("/info")
    public ResponseEntity<UserInfoResponse> getUserInfo() {
        Long userId = jwtTokenProvider.getUserId();
        Long branchId = jwtTokenProvider.getBranchId();
        return ResponseEntity.ok(userService.getUserInfo(userId, branchId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<UserSummaryResponse>> getAllUsers(@RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "10") int size,
                                                                              @RequestParam(required = false) Long branchId,
                                                                              @RequestParam boolean active )
    {
        return ResponseEntity.ok(userService.getAllUsers(branchId,active, page, size));
    }
}

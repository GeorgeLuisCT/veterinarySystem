package com.gaedet.veterinarysystem.core.users.controller;

import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserDetailResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserInfoResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserStatusUpdateRequest;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.service.UserService;
import com.gaedet.veterinarysystem.security.provider.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Map;

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
                                                                              @RequestParam boolean active,
                                                                              @RequestParam(required = false) String q) {
        return ResponseEntity.ok(userService.getAllUsers(branchId, active, page, size, q));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ResponseEntity<UserDetailResponse> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserDetail(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserSummaryResponse> updateStatus(@PathVariable Long userId,
                                                            @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(userId, request.getActive()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("message", "Usuario eliminado correctamente"));
    }
}

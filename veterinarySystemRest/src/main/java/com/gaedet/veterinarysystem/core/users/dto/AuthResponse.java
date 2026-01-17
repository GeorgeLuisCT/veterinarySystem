package com.gaedet.veterinarysystem.core.users.dto;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private List<BranchResponse> branches;
}
package com.gaedet.biocampovet.core.users.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class UserInfoResponse {
    private Long userId;
    private String username;
    private Set<String> roles;
    private  BranchResponse selectedBranch;
    private Long employeeId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String burden;
    private Set<BranchResponse> branches;
}


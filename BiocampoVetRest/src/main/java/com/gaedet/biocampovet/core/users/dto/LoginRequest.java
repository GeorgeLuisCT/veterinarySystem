package com.gaedet.biocampovet.core.users.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}

package com.gaedet.biocampovet.core.users.dto;

import com.gaedet.biocampovet.core.users.enums.RoleName;
import lombok.Getter;
import lombok.Setter;
import java.util.Set;

@Getter
@Setter
public class RegisterRequest {
    private String username;
    private String password;
    private Set<RoleName> roles;
    private Long employeeId;
}

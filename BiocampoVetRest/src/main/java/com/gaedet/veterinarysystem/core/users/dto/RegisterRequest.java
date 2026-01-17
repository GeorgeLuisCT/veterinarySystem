package com.gaedet.veterinarysystem.core.users.dto;

import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.Set;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotEmpty
    private Set<RoleName> roles;
    @NotNull
    private Long employeeId;
}

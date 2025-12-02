package com.gaedet.biocampovet.core.users.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
public class UserStatusUpdateRequest {
    @NotNull
    private Boolean active;
}

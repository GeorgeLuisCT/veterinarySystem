package com.gaedet.veterinarysystem.core.finance.dto.request;

import com.gaedet.veterinarysystem.core.finance.enums.TreasuryAccountType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class UpdateTreasuryAccountRequest {

    @NotBlank
    private String name;

    @NotNull
    private TreasuryAccountType type;

    private String description;
}

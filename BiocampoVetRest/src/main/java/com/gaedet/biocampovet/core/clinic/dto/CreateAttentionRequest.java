package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AttentionType;
import com.gaedet.biocampovet.core.clinic.enums.AttentionsStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAttentionRequest {

    @NotNull
    private Long branchId;

    @NotNull
    private Long animalId;

    @NotNull
    private Long attendingEmployeeId;

    @NotNull
    private LocalDateTime checkInTime;

    @NotNull
    private AttentionType type;

    @NotNull
    private AttentionsStatus status;

    @NotNull
    private Long clinicalServiceId;

    private Boolean emergency;
}

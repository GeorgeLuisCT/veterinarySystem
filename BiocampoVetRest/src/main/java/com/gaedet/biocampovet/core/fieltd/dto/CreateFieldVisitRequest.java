package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateFieldVisitRequest {
    private Long farmId;
    private Long zoneId;
    @NotNull
    private Long fieldVetId;
    private Long vehicleId;
    @NotNull
    private LocalDateTime scheduledDateTime;
    private String objective;
    @Builder.Default
    private List<Long> companionIds = new java.util.ArrayList<>();
}

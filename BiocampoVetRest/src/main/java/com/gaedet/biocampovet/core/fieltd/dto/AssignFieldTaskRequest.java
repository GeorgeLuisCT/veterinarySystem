package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AssignFieldTaskRequest {
    @NotNull
    private Long fieldVetId;
    private Long vehicleId;
    private List<Long> companionIds;
    @NotNull
    private LocalDateTime scheduledDateTime;
    private String objective;
}

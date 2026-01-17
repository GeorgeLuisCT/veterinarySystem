package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskStatus;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class UpdateFieldTaskRequest {
    @NotBlank private String title;
    private Long zoneId;
    @NotNull private Long farmId;
    private String description;
    @NotNull private FieldTaskPriority priority;
    @NotNull private FieldTaskStatus status;
    private LocalDateTime dueAt;
}

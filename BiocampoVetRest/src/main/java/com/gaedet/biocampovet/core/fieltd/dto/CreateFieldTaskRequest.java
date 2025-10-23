package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateFieldTaskRequest {
    @NotBlank
    private String title;
    private Long zoneId;
    @NotNull
    @NotEmpty
    private List<Long> farmIds;
    private String description;
    @NotNull
    private FieldTaskPriority priority;
    private FieldTaskStatus status;
    private LocalDateTime dueAt;
}

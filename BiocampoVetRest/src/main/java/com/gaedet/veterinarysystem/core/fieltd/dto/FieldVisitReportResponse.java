package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitReportResponse {
    private Long id;
    private Long version;
    private String findings;
    private String diagnoses;
    private String recommendations;
    private LocalDateTime updatedAt;
}

package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FieldRouteStopResponse {
    private Long id;
    private Integer position;
    private Long fieldVisitId;
    private String farmName;
    private LocalTime eta;
}


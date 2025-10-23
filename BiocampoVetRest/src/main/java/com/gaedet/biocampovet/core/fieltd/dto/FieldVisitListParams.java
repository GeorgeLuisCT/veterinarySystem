package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitListParams {
    private Integer page;
    private Integer size;
    private String q;
    private FieldVisitStatus status;
    private Long vetId;
    private Long farmId;
    private Long zoneId;
    private Long vehicleId;
    private LocalDateTime from;
    private LocalDateTime to;
}

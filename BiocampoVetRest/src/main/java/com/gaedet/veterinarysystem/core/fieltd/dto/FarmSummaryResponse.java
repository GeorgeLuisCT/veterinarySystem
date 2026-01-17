package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmSummaryResponse {
    private Long id;
    private String name;
    private Long customerId;
    private String customerName;
    private Long zoneId;
    private String zoneName;
}

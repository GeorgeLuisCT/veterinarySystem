package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmQuickSearchResponse {
    private Long id;
    private String name;
    private String customerName;
    private Long zoneId;
    private String zoneName;
}

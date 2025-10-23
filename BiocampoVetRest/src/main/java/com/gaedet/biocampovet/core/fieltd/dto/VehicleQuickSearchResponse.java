package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleQuickSearchResponse {
    private Long id;
    private String name;
    private String licensePlate;
    private boolean active;
}

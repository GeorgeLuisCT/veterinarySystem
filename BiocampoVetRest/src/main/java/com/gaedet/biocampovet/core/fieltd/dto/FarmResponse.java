package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmResponse {
    private Long id;
    private String name;
    private Long customerId;
    private String customerName;
    private Long zoneId;
    private String zoneName;
    private String locationDescription;
    private String gpsCoordinates;
    private String addressLabel;
}

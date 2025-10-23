package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetBiosecurityRequest {
    private Boolean vehicleAndEquipmentCleaned;
    private Boolean ppeUsed;
    private Boolean handHygiene;
    private String notes;
}

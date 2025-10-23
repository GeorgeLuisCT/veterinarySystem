package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitBiosecurityResponse {
    private boolean vehicleAndEquipmentCleaned;
    private boolean ppeUsed;
    private boolean handHygiene;
    private String notes;
}

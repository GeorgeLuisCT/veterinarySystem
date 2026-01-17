package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class VehicleResponse {
    private Long id;
    private String name;
    private String licensePlate;
    private Long assignedVetEmployeeId;
    private String assignedVetName;
    private Long homeBranchId;
    private String homeBranchName;
    private boolean active;
}


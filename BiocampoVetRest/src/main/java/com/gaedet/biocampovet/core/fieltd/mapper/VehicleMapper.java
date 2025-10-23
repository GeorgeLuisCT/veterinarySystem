package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.VehicleQuickSearchResponse;
import com.gaedet.biocampovet.core.fieltd.dto.VehicleResponse;
import com.gaedet.biocampovet.core.fieltd.entity.Vehicle;

public class VehicleMapper {
    public static VehicleResponse toResponse(Vehicle e) {
        return VehicleResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .licensePlate(e.getLicensePlate())
                .assignedVetEmployeeId(e.getAssignedVet() != null ? e.getAssignedVet().getId() : null)
                .assignedVetName(e.getAssignedVet() != null ? e.getAssignedVet().getFullName() : null)
                .homeBranchId(e.getHomeBranch() != null ? e.getHomeBranch().getId() : null)
                .homeBranchName(e.getHomeBranch() != null ? e.getHomeBranch().getName() : null)
                .active(e.isActive())
                .build();
    }

    public static VehicleQuickSearchResponse toQuickSearch(Vehicle e) {
        return VehicleQuickSearchResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .licensePlate(e.getLicensePlate())
                .active(e.isActive())
                .build();
    }
}

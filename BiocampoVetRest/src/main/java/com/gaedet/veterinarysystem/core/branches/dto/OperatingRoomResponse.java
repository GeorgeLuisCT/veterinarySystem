package com.gaedet.veterinarysystem.core.branches.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OperatingRoomResponse {

    private final Long id;
    private final String name;
    private final Long branchId;
    private final String branchName;
    private final String notes;
}

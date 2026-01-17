package com.gaedet.veterinarysystem.core.branches.mapper;

import com.gaedet.veterinarysystem.core.branches.dto.OperatingRoomResponse;
import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;

public final class OperatingRoomMapper {

    private OperatingRoomMapper() {
    }

    public static OperatingRoomResponse toResponse(OperatingRoom operatingRoom) {
        return OperatingRoomResponse.builder()
                .id(operatingRoom.getId())
                .name(operatingRoom.getName())
                .branchId(operatingRoom.getBranch() != null ? operatingRoom.getBranch().getId() : null)
                .branchName(operatingRoom.getBranch() != null ? operatingRoom.getBranch().getName() : null)
                .notes(operatingRoom.getNotes())
                .build();
    }
}

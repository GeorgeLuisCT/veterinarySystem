package com.gaedet.biocampovet.core.branches.mapper;

import com.gaedet.biocampovet.core.branches.dto.LaboratoryResponse;
import com.gaedet.biocampovet.core.branches.entity.Laboratory;

public final class LaboratoryMapper {

    private LaboratoryMapper() {
    }

    public static LaboratoryResponse toResponse(Laboratory laboratory) {
        return LaboratoryResponse.builder()
                .id(laboratory.getId())
                .name(laboratory.getName())
                .branchId(laboratory.getBranch() != null ? laboratory.getBranch().getId() : null)
                .branchName(laboratory.getBranch() != null ? laboratory.getBranch().getName() : null)
                .contactName(laboratory.getContactName())
                .contactPhone(laboratory.getContactPhone())
                .contactEmail(laboratory.getContactEmail())
                .notes(laboratory.getNotes())
                .build();
    }
}

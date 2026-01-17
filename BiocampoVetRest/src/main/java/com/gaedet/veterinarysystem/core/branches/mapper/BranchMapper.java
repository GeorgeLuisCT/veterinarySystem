package com.gaedet.veterinarysystem.core.branches.mapper;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import org.springframework.stereotype.Component;

@Component
public class BranchMapper {

    public BranchResponse toResponse(Branch branch) {
        if (branch == null) return null;

        return new BranchResponse(
                branch.getId(),
                branch.getName(),
                branch.getLocation()
        );
    }
}
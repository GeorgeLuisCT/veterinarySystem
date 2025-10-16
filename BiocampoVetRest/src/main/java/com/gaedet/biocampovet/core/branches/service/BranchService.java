package com.gaedet.biocampovet.core.branches.service;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BranchService {
    private final BranchRepository branchRepository;


    public List<BranchResponse> getBranchesByEmployeeId(Long employeeId) {
        List<Branch> branches = branchRepository.findBranchesByEmployeeId(employeeId);
        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }


    public List<BranchResponse> getAllBranches(String query) {
        List<Branch> branches;

        if (query == null || query.trim().isEmpty()) {
            branches = branchRepository.findAll();
        } else {
            branches = branchRepository.findByNameContainingIgnoreCase(query.trim());
        }

        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private BranchResponse convertToResponse(Branch branch) {
        return new BranchResponse(
                branch.getId(),
                branch.getName(),
                branch.getLocation()
        );
    }
}

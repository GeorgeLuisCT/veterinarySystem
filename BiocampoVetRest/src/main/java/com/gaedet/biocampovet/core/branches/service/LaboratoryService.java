package com.gaedet.biocampovet.core.branches.service;

import com.gaedet.biocampovet.core.branches.dto.LaboratoryResponse;
import com.gaedet.biocampovet.core.branches.mapper.LaboratoryMapper;
import com.gaedet.biocampovet.core.branches.repository.LaboratoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LaboratoryService {

    private final LaboratoryRepository laboratoryRepository;

    @Transactional(readOnly = true)
    public List<LaboratoryResponse> list(Long branchId) {
        if (branchId == null || branchId <= 0) {
            return laboratoryRepository.findAll()
                    .stream()
                    .map(LaboratoryMapper::toResponse)
                    .collect(Collectors.toList());
        }

        return laboratoryRepository.findByBranchId(branchId)
                .stream()
                .map(LaboratoryMapper::toResponse)
                .collect(Collectors.toList());
    }
}

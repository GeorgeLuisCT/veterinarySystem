package com.gaedet.veterinarysystem.core.branches.service;

import com.gaedet.veterinarysystem.core.branches.dto.OperatingRoomResponse;
import com.gaedet.veterinarysystem.core.branches.mapper.OperatingRoomMapper;
import com.gaedet.veterinarysystem.core.branches.repository.OperatingRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperatingRoomService {

    private final OperatingRoomRepository operatingRoomRepository;

    @Transactional(readOnly = true)
    public List<OperatingRoomResponse> list(Long branchId) {
        if (branchId == null || branchId <= 0) {
            return operatingRoomRepository.findAll()
                    .stream()
                    .map(OperatingRoomMapper::toResponse)
                    .collect(Collectors.toList());
        }

        return operatingRoomRepository.findByBranchId(branchId)
                .stream()
                .map(OperatingRoomMapper::toResponse)
                .collect(Collectors.toList());
    }
}

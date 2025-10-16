package com.gaedet.biocampovet.core.branches.repository;

import com.gaedet.biocampovet.core.branches.entity.OperatingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatingRoomRepository extends JpaRepository<OperatingRoom, Long> {

    boolean existsByBranchIdAndNameIgnoreCase(Long branchId, String name);

    @NonNull
    List<OperatingRoom> findByBranchId(Long branchId);
}

package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long>, JpaSpecificationExecutor<Farm> {
    boolean existsByCustomer_IdAndNameIgnoreCase(Long customerId, String name);
    boolean existsByCustomer_IdAndNameIgnoreCaseAndIdNot(Long customerId, String name, Long id);
    List<Farm> findTop10ByNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Farm> findTop10ByZone_IdAndNameContainingIgnoreCaseOrderByNameAsc(Long zoneId, String name);
    List<Farm> findTop10ByOrderByNameAsc();
    List<Farm> findTop10ByZone_IdOrderByNameAsc(Long zoneId);
}

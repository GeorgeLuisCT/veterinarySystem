package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<Vehicle> findTop10ByNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Vehicle> findTop10ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Vehicle> findTop10ByOrderByNameAsc();
    List<Vehicle> findTop10ByActiveTrueOrderByNameAsc();
}

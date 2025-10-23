package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.GeoZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeoZoneRepository extends JpaRepository<GeoZone, Long>, JpaSpecificationExecutor<GeoZone> {
    boolean existsByNameIgnoreCaseAndParent_Id(String name, Long parentId);
    boolean existsByNameIgnoreCaseAndParent_IdAndIdNot(String name, Long parentId, Long id);
    boolean existsByNameIgnoreCaseAndParentIsNull(String name);
    boolean existsByNameIgnoreCaseAndParentIsNullAndIdNot(String name, Long id);
    Optional<GeoZone> findByNameIgnoreCaseAndParent_Id(String name, Long parentId);
}

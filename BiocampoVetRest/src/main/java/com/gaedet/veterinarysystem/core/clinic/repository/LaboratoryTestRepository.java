package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LaboratoryTestRepository extends JpaRepository<LaboratoryTest, Long>, JpaSpecificationExecutor<LaboratoryTest> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    Optional<LaboratoryTest> findById(Long id);

    @Query(nativeQuery = true,
            value = "SELECT DISTINCT t.id, t.code, t.name, t.price " +
                    "FROM laboratory_tests t " +
                    "LEFT JOIN laboratory_test_laboratories ltl ON t.id = ltl.laboratory_test_id " +
                    "WHERE (t.active = :isActive) " +
                    "  AND (:laboratoryId IS NULL OR ltl.laboratory_id = :laboratoryId AND ltl.is_active = :isActive) " +
                    "  AND (:query IS NULL OR (LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.code) LIKE LOWER(CONCAT('%', :query, '%')))) " +
                    "ORDER BY t.name ASC LIMIT 20")
    List<Object[]> quickLaboratoryTestSearch(
            @Param("query") String query,
            @Param("laboratoryId") Long laboratoryId,
            @Param("isActive") boolean isActive
    );
}

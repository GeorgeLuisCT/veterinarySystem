package com.gaedet.biocampovet.core.animal.repository;

import com.gaedet.biocampovet.core.animal.dto.AnimalSummaryResponse;
import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

    @Query(value = """
    SELECT
        a.id,
        a.name,
        a.birth_date,
        a.breed,
        a.species AS species_name,
        c.name AS owner_name,
        a.is_active
    FROM animal a
    JOIN customer c ON a.customer_id = c.id
    WHERE (:isActive IS NULL OR a.is_active = :isActive)
      AND (
            :query IS NULL OR
            LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.breed) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.species) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    ORDER BY a.name
    """,
                countQuery = """
    SELECT COUNT(a.id)
    FROM animal a
    JOIN customer c ON a.customer_id = c.id
    WHERE (:isActive IS NULL OR a.is_active = :isActive)
      AND (
            :query IS NULL OR
            LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.breed) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.species) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    """,
            nativeQuery = true)
    Page<Object[]> findAnimalSummary(
            @Param("query") String query,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query(value = """
    SELECT
        a.id,
        a.name,
        a.birth_date,
        c.name AS owner_name,
        a.species AS species_name,
        a.photo_url,
        a.microchip_number
    FROM animal a
    JOIN customer c ON a.customer_id = c.id
    WHERE (:isActive IS NULL OR a.is_active = :isActive)
      AND (
            :query IS NULL OR
            LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.breed) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.species) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(a.microchip_number) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    ORDER BY a.name
    LIMIT 10
    """, nativeQuery = true)
    List<Object[]> quickAnimalSearch(
            @Param("query") String query,
            @Param("isActive") Boolean isActive
    );

    @EntityGraph(type = EntityGraph.EntityGraphType.LOAD, attributePaths = {
            "owner",
            "owner.documentType",
            "allergies",
            "chronicConditions"
    })
    Optional<Animal> findWithDetailsById(Long id);



    @EntityGraph(attributePaths = {"owner"})
    @Query("""
        select a from Animal a
        where (:query is null or lower(a.name) like lower(concat('%', :query, '%'))
            or lower(a.owner.name) like lower(concat('%', :query, '%'))
            or lower(a.breed) like lower(concat('%', :query, '%'))
            or lower(a.microchipNumber) like lower(concat('%', :query, '%')))
          and (:speciesList is null or a.species in :speciesList)
          and (:active is null or a.isActive = :active)
        order by a.name asc
    """)
    Page<Animal> searchForClinicalHistory(
            @Param("query") String query,
            @Param("speciesList") List<AnimalSpecies> speciesList,
            @Param("active") Boolean active,
            Pageable pageable
    );

    boolean existsByOwner_IdAndNameIgnoreCase(Long ownerId, String name);
}

package com.gaedet.biocampovet.core.customer.repository;

import com.gaedet.biocampovet.core.customer.entity.Customer;
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
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query(value = """
    SELECT
        c.id,
        c.name,
        c.document_number,
        dt.name AS document_type_name,
        c.phone_number,
        c.email,
        c.is_active
    FROM customer c
    JOIN document_type dt ON c.document_type_id = dt.id
    WHERE (:isActive IS NULL OR c.is_active = :isActive)
      AND (
            :query IS NULL OR 
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR 
            LOWER(c.document_number) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.phone_number) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    ORDER BY c.name
    """,
            countQuery = """
    SELECT COUNT(c.id)
    FROM customer c
    JOIN document_type dt ON c.document_type_id = dt.id
    WHERE (:isActive IS NULL OR c.is_active = :isActive)
      AND (
            :query IS NULL OR 
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR 
            LOWER(c.document_number) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.phone_number) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    """,
            nativeQuery = true)
    Page<Object[]> findCustomerSummary(
            @Param("query") String query,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query(value = """
    SELECT
        c.id,
        c.name,
        c.document_number
    FROM customer c
    WHERE (:isActive IS NULL OR c.is_active = :isActive)
      AND (
            :query IS NULL OR 
            LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR 
            LOWER(c.document_number) LIKE LOWER(CONCAT('%', :query, '%'))
          )
    ORDER BY c.name
    LIMIT 10
    """,
            nativeQuery = true)
    List<Object[]> quickCustomerSearch(
            @Param("query") String query,
            @Param("isActive") Boolean isActive
    );

    @EntityGraph(attributePaths = {"documentType"})
    Optional<Customer> findWithDetailsById(Long id);

    boolean existsByDocumentNumberAndIdNot(String documentNumber, Long id);

    Optional<Customer> findByDocumentNumber(String documentNumber);
    boolean existsByDocumentNumber(String documentNumber);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhoneNumber(String phoneNumber);
}
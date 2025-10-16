package com.gaedet.biocampovet.core.customer.repository;

import com.gaedet.biocampovet.core.customer.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {

    Optional<DocumentType> findById(Long id);

    Optional<DocumentType> findByName(String name);

    boolean existsByName(String name);

    Optional<DocumentType> findByNameIgnoreCase(String name);
    Optional<DocumentType> findByAbbreviationIgnoreCase(String abbreviation);

}
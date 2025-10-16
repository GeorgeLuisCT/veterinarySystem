package com.gaedet.biocampovet.core.branches.repository;

import com.gaedet.biocampovet.core.branches.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findFirstByOrderByIdAsc();
}

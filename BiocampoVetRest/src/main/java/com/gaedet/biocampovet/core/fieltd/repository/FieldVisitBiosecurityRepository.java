package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitBiosecurity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldVisitBiosecurityRepository extends JpaRepository<FieldVisitBiosecurity, Long> { }


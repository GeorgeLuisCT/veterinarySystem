package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldVisitServiceItemRepository extends JpaRepository<FieldVisitServiceItem, Long> { }


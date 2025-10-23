package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldVisitAttachmentRepository extends JpaRepository<FieldVisitAttachment, Long> { }


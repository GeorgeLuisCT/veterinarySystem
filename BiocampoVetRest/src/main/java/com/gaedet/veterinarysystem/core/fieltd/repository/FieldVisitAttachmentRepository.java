package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldVisitAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldVisitAttachmentRepository extends JpaRepository<FieldVisitAttachment, Long> { }


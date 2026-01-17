package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.PostOperativeIndication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostOperativeIndicationRepository extends JpaRepository<PostOperativeIndication, Long> {
}

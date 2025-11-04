package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.Reminder;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long>, JpaSpecificationExecutor<Reminder> {

    @Override
    @EntityGraph(attributePaths = {
            "animal",
            "animal.owner"
    })
    List<Reminder> findAll(org.springframework.data.jpa.domain.Specification<Reminder> spec, Sort sort);
}

package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.EvolutionNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvolutionNoteRepository extends JpaRepository<EvolutionNote, Long> {
}

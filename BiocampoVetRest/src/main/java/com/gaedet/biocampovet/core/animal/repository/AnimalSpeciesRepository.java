package com.gaedet.biocampovet.core.animal.repository;

import com.gaedet.biocampovet.core.animal.entity.AnimalSpecies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimalSpeciesRepository extends JpaRepository<AnimalSpecies, Long> {

    Optional<AnimalSpecies> findById(Long id);

    Optional<AnimalSpecies> findByName(String name);

    boolean existsByName(String name);

    Optional<AnimalSpecies> findByNameIgnoreCase(String name);}


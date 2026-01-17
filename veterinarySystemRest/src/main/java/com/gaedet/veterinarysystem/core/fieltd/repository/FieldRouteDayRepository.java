package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldRouteDay;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FieldRouteDayRepository extends JpaRepository<FieldRouteDay, Long> {
    @EntityGraph(attributePaths = {"employee", "vehicle", "stops", "stops.fieldVisit", "stops.fieldVisit.farm"})
    List<FieldRouteDay> findByRouteDate(LocalDate date);
}


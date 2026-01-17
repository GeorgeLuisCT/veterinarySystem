package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldRouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldRouteStopRepository extends JpaRepository<FieldRouteStop, Long> { }


package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.VehicleLocationPing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface VehicleLocationPingRepository extends JpaRepository<VehicleLocationPing, Long> {
    Page<VehicleLocationPing> findByVehicle_IdAndTimestampBetween(Long vehicleId, LocalDateTime from, LocalDateTime to, Pageable pageable);
}


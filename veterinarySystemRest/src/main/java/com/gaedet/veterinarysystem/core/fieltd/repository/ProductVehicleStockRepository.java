package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.ProductVehicleStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductVehicleStockRepository extends JpaRepository<ProductVehicleStock, Long> {
    Optional<ProductVehicleStock> findByVehicle_IdAndProduct_Id(Long vehicleId, Long productId);


    Page<ProductVehicleStock> findByVehicle_Id(Long vehicleId, Pageable pageable);
}

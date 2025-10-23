package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.ProductStockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductStockMovementRepository extends JpaRepository<ProductStockMovement, Long> {
    Page<ProductStockMovement> findByVehicle_Id(Long vehicleId, Pageable pageable);
}


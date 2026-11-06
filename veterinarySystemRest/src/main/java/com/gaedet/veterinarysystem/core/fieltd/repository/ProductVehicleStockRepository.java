package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.ProductVehicleStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductVehicleStockRepository extends JpaRepository<ProductVehicleStock, Long> {
    /** Con bloqueo de fila: dos consumos simultáneos no pueden dejar el stock del vehículo en negativo. */
    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<ProductVehicleStock> findByVehicle_IdAndProduct_Id(Long vehicleId, Long productId);


    Page<ProductVehicleStock> findByVehicle_Id(Long vehicleId, Pageable pageable);
}

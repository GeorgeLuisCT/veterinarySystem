package com.gaedet.veterinarysystem.core.sales.repository;

import com.gaedet.veterinarysystem.core.sales.entity.SaleDetail;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface SaleDetailRepository extends JpaRepository<SaleDetail, Long>, JpaSpecificationExecutor<SaleDetail> {

    List<SaleDetail> findBySaleId(Long saleId);

    Optional<SaleDetail> findByServiceTypeAndServiceItemId(BillableServiceType serviceType, Long serviceItemId);

    List<SaleDetail> findByProductId(Long productId);
}


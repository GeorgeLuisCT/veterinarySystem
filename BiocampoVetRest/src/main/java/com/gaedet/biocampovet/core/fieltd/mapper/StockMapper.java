package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.ProductStockMovementResponse;
import com.gaedet.biocampovet.core.fieltd.dto.VehicleStockResponse;
import com.gaedet.biocampovet.core.fieltd.entity.ProductStockMovement;
import com.gaedet.biocampovet.core.fieltd.entity.ProductVehicleStock;

public class StockMapper {
    public static VehicleStockResponse toVehicleStock(ProductVehicleStock e) {
        return VehicleStockResponse.builder()
                .id(e.getId())
                .vehicleId(e.getVehicle().getId())
                .productId(e.getProduct().getId())
                .productName(e.getProduct().getName())
                .sku(e.getProduct().getSku())
                .unit(e.getUnit())
                .quantity(e.getQuantity())
                .build();
    }
    public static ProductStockMovementResponse toMovement(ProductStockMovement e) {
        return ProductStockMovementResponse.builder()
                .id(e.getId())
                .movementType(e.getMovementType())
                .productId(e.getProduct().getId())
                .productName(e.getProduct().getName())
                .unit(e.getUnit())
                .quantityDelta(e.getQuantityDelta())
                .fromType(e.getFromType())
                .toType(e.getToType())
                .vehicleId(e.getVehicle() != null ? e.getVehicle().getId() : null)
                .branchId(e.getBranch() != null ? e.getBranch().getId() : null)
                .fieldVisitId(e.getFieldVisit() != null ? e.getFieldVisit().getId() : null)
                .createdById(e.getCreatedBy() != null ? e.getCreatedBy().getId() : null)
                .createdAt(e.getCreatedAt())
                .notes(e.getNotes())
                .build();
    }
}

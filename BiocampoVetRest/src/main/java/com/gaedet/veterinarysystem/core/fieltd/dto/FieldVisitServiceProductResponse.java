package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.inventory.dto.ProductBasicResponse;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceProductResponse {
    private Long id;
    private ProductBasicResponse product;
    private BigDecimal dose;
    private ProductUnitType unit;
    private AdministrationRoute administrationRoute;
}
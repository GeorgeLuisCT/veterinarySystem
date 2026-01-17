package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddClinicalServiceProductRequest {
    private Long productId;
    private BigDecimal dose;
    private ProductUnitType unit;
    private AdministrationRoute administrationRoute;
}

package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.inventory.dto.ProductBasicResponse;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;

import java.math.BigDecimal;

public record ClinicalServiceProductResponse (
     Long id,
     ProductBasicResponse product,
     BigDecimal dose,
     ProductUnitType unit,
     AdministrationRoute administrationRoute
){}

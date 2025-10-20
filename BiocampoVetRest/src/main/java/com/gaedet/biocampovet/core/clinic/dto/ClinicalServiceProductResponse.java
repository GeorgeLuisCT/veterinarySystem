package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.inventory.dto.ProductResponse;
import com.gaedet.biocampovet.core.inventory.dto.ProductSummaryResponse;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import java.math.BigDecimal;

public record ClinicalServiceProductResponse (
     Long id,
     ProductSummaryResponse product,
     BigDecimal dose,
     ProductUnitType unit,
     AdministrationRoute administrationRoute
){}

package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.FrequencyUnit;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class MedicationAdministrationResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final LocalDateTime administeredAt;
    private final BigDecimal doseAmount;
    private final ProductUnitType doseUnit;
    private final AdministrationRoute route;
    private final Integer frequencyValue;
    private final FrequencyUnit frequencyUnit;
    private final Long administeredByEmployeeId;
    private final String administeredByEmployeeFullName;
    private final String notes;
}

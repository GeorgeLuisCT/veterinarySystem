package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateHealthPlanRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a cero.")
    private BigDecimal price;

    private String notes;

    @NotEmpty
    @Valid
    private List<HealthPlanServiceItemRequest> serviceItems;

    @AssertTrue(message = "Cada servicio clínico solo puede agregarse una vez.")
    private boolean isServiceUnique() {
        if (serviceItems == null) {
            return false;
        }
        Set<Long> uniqueIds = new HashSet<>();
        for (HealthPlanServiceItemRequest item : serviceItems) {
            if (item == null || item.getClinicalServiceId() == null) {
                return false;
            }
            if (!uniqueIds.add(item.getClinicalServiceId())) {
                return false;
            }
        }
        return true;
    }
}

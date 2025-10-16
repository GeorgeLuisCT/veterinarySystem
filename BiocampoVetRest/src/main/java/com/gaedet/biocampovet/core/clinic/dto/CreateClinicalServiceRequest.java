package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchActivationInput;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.global.enums.TimeUnit;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateClinicalServiceRequest {
    @NotBlank
    private String name;

    @NotNull
    private ClinicalServiceCategory clinicalServiceCategory;

    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal price;

    @Min(0)
    private Integer reminderPeriod;

    private TimeUnit reminderPeriodUnit;

    private Set<String> requiredSampleTypes;

    private Set<Long> requiredProductIds;

    private List<BranchActivationInput> branches;

    @AssertTrue(message = "El período y su unidad de tiempo deben especificarse juntos.")
    private boolean isReminderPeriodConsistent() {
        return (reminderPeriod == null && reminderPeriodUnit == null) ||
                (reminderPeriod != null && reminderPeriodUnit != null);
    }
}

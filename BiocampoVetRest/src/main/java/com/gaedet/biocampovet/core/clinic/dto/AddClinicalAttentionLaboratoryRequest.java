package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddClinicalAttentionLaboratoryRequest {

    @NotNull
    private Long laboratoryId;

    private Long requestingEmployeeId;

    private LabRequestStatus status;

    private LocalDateTime createdAt;

    private String clinicalNotes;

    @Valid
    @NotNull
    private List<Item> items;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {

        @NotNull
        private Long testId;


        @NotNull
        private BigDecimal unitPrice;

        @NotNull
        private BigDecimal quantity;

        private String notes;
    }
}

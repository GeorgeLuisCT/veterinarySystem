package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryRequestItemResponse {
    private Long id;
    private Long testId;
    private String testName;
    private String testCode;
    private LabRequestItemStatus status;
    private String notes;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime reportedAt;
    private LocalDateTime verifiedAt;
    private BigDecimal unitPrice;
    private BigDecimal quantity;
    private BigDecimal subtotal;
    private List<LaboratoryResultValueResponse> results;
    private List<LaboratoryTestParameterResponse> parameters;

    public static LaboratoryRequestItemResponse fromEntity(LaboratoryRequestItem entity) {
        return LaboratoryRequestItemResponse.builder()
                .id(entity.getId())
                .testId(entity.getTest().getId())
                .testName(entity.getTest().getName())
                .testCode(entity.getTest().getCode())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .requestedAt(entity.getRequestedAt())
                .processedAt(entity.getProcessedAt())
                .reportedAt(entity.getReportedAt())
                .verifiedAt(entity.getVerifiedAt())
                .unitPrice(entity.getUnitPrice())
                .quantity(entity.getQuantity())
                .subtotal(entity.getSubtotal())
                .results(entity.getResults().stream().map(LaboratoryResultValueResponse::fromEntity).collect(Collectors.toList()))
                .parameters(entity.getTest().getParameters().stream().map(LaboratoryTestParameterResponse::fromEntity).collect(Collectors.toList()))
                .build();
    }
}
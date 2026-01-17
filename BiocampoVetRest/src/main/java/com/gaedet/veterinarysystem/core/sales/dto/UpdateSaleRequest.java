package com.gaedet.veterinarysystem.core.sales.dto;

import com.gaedet.veterinarysystem.core.sales.enums.SalesDocumentType;
import lombok.*;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSaleRequest {

    @NotNull
    private Long branchId;

    @NotNull
    private Long sellerId;

    private Long customerId;

    private SalesDocumentType documentType;

    @Size(max = 32)
    private String documentNumber;

    private String notes;

    private Long sourceAttentionId;
}
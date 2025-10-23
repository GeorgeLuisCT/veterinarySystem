package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceItemResponse {
    private Long id;
    private Long clinicalServiceId;
    private String clinicalServiceName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private Long performedById;
    private String performedByName;
    private String notes;
}

package com.gaedet.veterinarysystem.core.fieltd.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.*;

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
    @Builder.Default
    private List<FieldVisitServiceAnimalResponse> animals = List.of();
    @Builder.Default
    private List<FieldVisitServiceGroupResponse> groups = List.of();
    @Builder.Default
    private List<FieldVisitServiceProductResponse> products = List.of();
}

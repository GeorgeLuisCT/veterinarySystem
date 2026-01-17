package com.gaedet.veterinarysystem.core.customer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerResponse {

    private Long id;
    private String name;
    private DocumentTypeResponse documentType;
    private String documentNumber;
    private String phoneNumber;
    private String email;
    private String address;
    private boolean isActive;
}
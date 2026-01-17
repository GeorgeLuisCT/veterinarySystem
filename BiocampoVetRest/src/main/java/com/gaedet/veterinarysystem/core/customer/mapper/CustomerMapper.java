package com.gaedet.veterinarysystem.core.customer.mapper;

import com.gaedet.veterinarysystem.core.customer.dto.*;
import com.gaedet.veterinarysystem.core.customer.entity.Customer;
import com.gaedet.veterinarysystem.core.customer.entity.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {

    private final DocumentTypeMapper documentTypeMapper;

    public CustomerMapper(DocumentTypeMapper documentTypeMapper) {
        this.documentTypeMapper = documentTypeMapper;
    }

    public Customer toEntity(CustomerCreateRequest request, DocumentType documentType) {
        return Customer.builder()
                .name(request.getName())
                .documentType(documentType)
                .documentNumber(request.getDocumentNumber())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .isActive(true)
                .build();
    }

    public CustomerResponse toResponse(Customer entity) {
        if (entity == null) {
            return null;
        }

        return CustomerResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .documentType(documentTypeMapper.toResponse(entity.getDocumentType()))
                .documentNumber(entity.getDocumentNumber())
                .phoneNumber(entity.getPhoneNumber())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .isActive(entity.isActive())
                .build();
    }

    public CustomerSummaryResponse toCustomerSummaryResponse(Customer customer) {
        return new CustomerSummaryResponse(
                customer.getId(),
                customer.getName(),
                customer.getDocumentNumber(),
                customer.getDocumentType().getName(),
                customer.getPhoneNumber(),
                customer.getEmail(),
                customer.isActive()
        );
    }

    public void updateEntity(Customer entity, CustomerUpdateRequest request, DocumentType documentType) {
        entity.setName(request.getName());
        entity.setDocumentType(documentType);
        entity.setDocumentNumber(request.getDocumentNumber());
        entity.setPhoneNumber(request.getPhoneNumber());
        entity.setEmail(request.getEmail());
        entity.setAddress(request.getAddress());
    }
}
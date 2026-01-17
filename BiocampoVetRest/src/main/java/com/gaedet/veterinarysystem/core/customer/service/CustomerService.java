package com.gaedet.veterinarysystem.core.customer.service;

import com.gaedet.veterinarysystem.core.customer.dto.*;
import com.gaedet.veterinarysystem.core.customer.entity.Customer;
import com.gaedet.veterinarysystem.core.customer.entity.DocumentType;
import com.gaedet.veterinarysystem.core.customer.mapper.CustomerMapper;
import com.gaedet.veterinarysystem.core.customer.repository.CustomerRepository;
import com.gaedet.veterinarysystem.core.customer.repository.DocumentTypeRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final CustomerMapper customerMapper;
    private final EntityManager entityManager;

    @Transactional
    public CustomerSummaryResponse createCustomer(CustomerCreateRequest request) {

        if (customerRepository.existsByDocumentNumber(request.getDocumentNumber())) {
            throw new BadRequestException("El número de documento ya está en uso");
        }

        DocumentType documentType = entityManager.getReference(DocumentType.class, request.getDocumentTypeId());

        Customer customer = customerMapper.toEntity(request, documentType);
        customerRepository.save(customer);

        return customerMapper.toCustomerSummaryResponse(customer);
    }

    public CustomerResponse getCustomer(Long id) {
        Customer customer = customerRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return customerMapper.toResponse(customer);
    }

    public PaginatedResponse<CustomerSummaryResponse> getCustomers(int page, int size, Boolean isActive, String query) {
        Pageable pageable = PageRequest.of(page, size);
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();

        Page<Object[]> rawPage = customerRepository.findCustomerSummary(searchQuery, isActive, pageable);
        Page<CustomerSummaryResponse> customerPage = rawPage.map(CustomerSummaryResponse::fromNativeRow);

        return PaginatedResponse.<CustomerSummaryResponse>builder()
                .content(customerPage.getContent())
                .totalPages(customerPage.getTotalPages())
                .totalElements(customerPage.getTotalElements())
                .currentPage(customerPage.getNumber())
                .pageSize(customerPage.getSize())
                .build();
    }

    public List<CustomerQuickSearchResponse> searchCustomersByName(String query) {
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();

        List<Object[]> rawResults = customerRepository.quickCustomerSearch(searchQuery, true);

        return rawResults.stream()
                .map(CustomerQuickSearchResponse::fromNativeRow)
                .toList();
    }

    @Transactional
    public CustomerSummaryResponse updateCustomer(CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        DocumentType documentType = documentTypeRepository.findById(request.getDocumentTypeId())
                .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado"));

        if (customerRepository.existsByDocumentNumberAndIdNot(request.getDocumentNumber(), request.getId())) {
            throw new BadRequestException("El número de documento ya está en uso por otro cliente");
        }

        customerMapper.updateEntity(customer, request, documentType);

        customerRepository.save(customer);

        return customerMapper.toCustomerSummaryResponse(customer);
    }

    @Transactional
    public void softDeleteCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        customer.setActive(false);

        customerRepository.save(customer);
    }

    @Transactional
    public void hardDeleteCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Cliente no encontrado");
        }
        customerRepository.deleteById(customerId);
    }

    @Transactional
    public CustomerSummaryResponse restoreCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        customer.setActive(true);

        customerRepository.save(customer);

        return customerMapper.toCustomerSummaryResponse(customer);
    }
}



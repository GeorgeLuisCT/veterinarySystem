package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.customer.dto.CustomerResponse;
import com.gaedet.biocampovet.core.employees.dto.EmployeeResponse;
import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleResponse {
    private Long id;
    private BranchResponse branch;
    private EmployeeResponse employee;
    private CustomerResponse customer;
    private LocalDateTime saleDate;
    private List<SaleProductResponse> saleProducts;
    private List<SalePaymentResponse> payments;
    private SaleStatus status;
}
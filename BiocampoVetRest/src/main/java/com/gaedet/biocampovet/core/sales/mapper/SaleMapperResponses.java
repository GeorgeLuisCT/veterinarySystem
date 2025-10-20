package com.gaedet.biocampovet.core.sales.mapper;

import com.gaedet.biocampovet.core.animal.mapper.AnimalMapper;
import com.gaedet.biocampovet.core.branches.mapper.BranchMapper;
import com.gaedet.biocampovet.core.customer.mapper.CustomerMapper;
import com.gaedet.biocampovet.core.employees.mapper.EmployeeMapper;
import com.gaedet.biocampovet.core.inventory.mapper.ProductMapper;
import com.gaedet.biocampovet.core.sales.dto.*;
import com.gaedet.biocampovet.core.sales.entity.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class SaleMapperResponses {

    private final BranchMapper branchMapper;
    private final EmployeeMapper employeeMapper;
    private final CustomerMapper customerMapper;
    private final AnimalMapper animalMapper;


    SaleMapperResponses(BranchMapper branchMapper,
                        EmployeeMapper employeeMapper,
                        CustomerMapper customerMapper,
                        AnimalMapper animalMapper
                        ) {
        this.branchMapper = branchMapper;
        this.employeeMapper = employeeMapper;
        this.customerMapper = customerMapper;
        this.animalMapper = animalMapper;

    }

    public SaleResponse toResponse(Sale sale) {
        if (sale == null) return null;

        return new SaleResponse(
                sale.getId(),
                branchMapper.toResponse(sale.getBranch()),
                employeeMapper.toResponse(sale.getEmployee()),
                customerMapper.toResponse(sale.getCustomer()),
                sale.getSaleDate(),
                sale.getSaleProducts().stream()
                        .map(this::toSaleProductResponse)
                        .collect(Collectors.toList()),
                sale.getSalePayments().stream()
                        .map(this::toSalePaymentResponse)
                        .collect(Collectors.toList()),
                sale.getStatus()
        );
    }


    public SaleProductResponse toSaleProductResponse(SaleProduct saleProduct) {
        if (saleProduct == null) return null;

        return new SaleProductResponse(
                saleProduct.getId(),
                ProductMapper.toResponse(saleProduct.getProduct()),
                saleProduct.getUnitType(),
                saleProduct.getQuantityEquivalent(),
                saleProduct.getPrice(),
                saleProduct.getDiscount(),
                saleProduct.getSubtotal(),
                animalMapper.toResponse(saleProduct.getAnimal()),
                saleProduct.isApplied()
        );
    }

    public SalePaymentResponse toSalePaymentResponse(SalePayment payment) {
        return new SalePaymentResponse(
                payment.getId(),
                payment.getPayment().getPaymentMethod().getId(),
                payment.getPayment().getPaymentMethod().getName(),
                payment.getPayment().getAmount()
        );
    }

}
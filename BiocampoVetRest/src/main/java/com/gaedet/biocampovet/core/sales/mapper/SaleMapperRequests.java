package com.gaedet.biocampovet.core.sales.mapper;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.entity.Payment;
import com.gaedet.biocampovet.core.cash.enums.PaymentType;
import com.gaedet.biocampovet.core.cash.repository.PaymentRepository;
import com.gaedet.biocampovet.core.customer.repository.CustomerRepository;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import com.gaedet.biocampovet.core.cash.repository.PaymentMethodRepository;
import com.gaedet.biocampovet.core.sales.dto.*;
import com.gaedet.biocampovet.core.sales.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SaleMapperRequests {

    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final AnimalRepository animalRepository;
    private final PaymentRepository paymentRepository;

    public Sale toEntity(SaleRequest request, Cashbox cashBox , Long branchId, Long employeeId) {
        Sale sale = new Sale();

        sale.setBranch(branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada")));

        sale.setEmployee(employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado")));

        if (request.getCustomerId() != null) {
            sale.setCustomer(customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado")));
        }

        sale.setSaleDate(LocalDateTime.now());
        sale.setStatus(request.getStatus());

        // Mapear pagos
        if (request.getSalePayments() != null) {
            sale.setSalePayments(mapSalePayments(request.getSalePayments(), sale,cashBox, PaymentType.SALE ));
        }

        // Mapear productos
        if (request.getSaleProducts() != null) {
            Set<SaleProduct> products = request.getSaleProducts().stream()
                    .map(req -> toSaleProductEntity(req, sale))
                    .collect(Collectors.toSet());
            sale.setSaleProducts(products);
        }

        return sale;
    }

    public SaleProduct toSaleProductEntity(SaleProductRequest request, Sale sale) {
        if (!productRepository.existsById(request.getProductId()))
            throw new RuntimeException("Producto no encontrado: " + request.getProductId());

        SaleProduct product = new SaleProduct();
        product.setSale(sale);
        product.setProduct(Product.builder().id(request.getProductId()).build());
        product.setUnitType(request.getUnitType());
        product.setQuantityEquivalent(request.getQuantityEquivalent());
        product.setPrice(request.getPrice());
        product.setDiscount(request.getDiscount());
        product.setSubtotal(request.getSubtotal());
        product.setApplied(request.getApplied());

        if (request.getAnimalId() != null && animalRepository.existsById(request.getAnimalId())) {
            product.setAnimal(Animal.builder().id(request.getAnimalId()).build());
        }

        return product;
    }

    public Set<SalePayment> mapSalePayments(
            List<SalePaymentRequest> paymentRequests,
            Sale sale,
            Cashbox cashBox,
            PaymentType paymentType
    ) {
        return paymentRequests.stream()
                .map(p -> {
                    PaymentMethod method = paymentMethodRepository.findById(Long.parseLong(p.getMethodId()))
                            .orElseThrow(() -> new RuntimeException("Método de pago no encontrado: " + p.getMethodId()));

                    Payment payment = Payment.builder()
                            .type(paymentType)
                            .cashbox(cashBox)
                            .paymentMethod(method)
                            .amount(BigDecimal.valueOf(p.getAmount()))
                            .description(p.getDescription())
                            .operationNumber(p.getOperationNumber())
                            .documentReference(p.getDocumentReference())
                            .receivedBy(p.getReceivedBy())
                            .notes(p.getNotes())
                            .build();

                    payment = paymentRepository.save(payment);

                    return SalePayment.builder()
                            .sale(sale)
                            .payment(payment)
                            .detail(p.getDetail())
                            .build();
                })
                .collect(Collectors.toSet());
    }
}


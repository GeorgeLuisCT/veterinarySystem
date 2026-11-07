package com.gaedet.veterinarysystem.core.sales.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.cashbox.entity.CashSession;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus;
import com.gaedet.veterinarysystem.core.cashbox.repository.CashSessionRepository;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceRegistry;
import com.gaedet.veterinarysystem.core.sales.dto.FinalizeSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.SalePaymentRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.VoidSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.response.SaleResponse;
import com.gaedet.veterinarysystem.core.sales.entity.Sale;
import com.gaedet.veterinarysystem.core.sales.entity.SaleDetail;
import com.gaedet.veterinarysystem.core.sales.entity.SalePayment;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import com.gaedet.veterinarysystem.core.sales.enums.PaymentMethod;
import com.gaedet.veterinarysystem.core.sales.enums.SaleStatus;
import com.gaedet.veterinarysystem.core.sales.repository.SalePaymentRepository;
import com.gaedet.veterinarysystem.core.sales.repository.SaleRepository;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import com.gaedet.veterinarysystem.core.inventory.service.KardexService;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.customer.repository.CustomerRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductBatchRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductSaleModeRepository;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleServicePaymentsTest {

    @Mock SaleRepository saleRepository;
    @Mock BranchRepository branchRepository;
    @Mock UserRepository userRepository;
    @Mock CustomerRepository customerRepository;
    @Mock ProductRepository productRepository;
    @Mock ProductBatchRepository productBatchRepository;
    @Mock ProductSaleModeRepository productSaleModeRepository;
    @Mock CashSessionRepository cashSessionRepository;
    @Mock SalePaymentRepository salePaymentRepository;
    @Mock KardexService kardexService;
    @Mock BillableServiceRegistry billableServiceRegistry;

    @InjectMocks SaleService service;

    Branch branch;
    User seller;
    CashSession session;

    @BeforeEach
    void setUp() {
        branch = new Branch();
        branch.setId(1L);
        branch.setName("Central");

        Employee employee = new Employee();
        employee.setFirstName("Ana");
        employee.setLastName("Vendedora");
        seller = User.builder().id(20L).username("ana").employee(employee).build();

        // La caja la abrió OTRO usuario (id 99): igual debe recibir los cobros de la sucursal
        User cashier = User.builder().id(99L).username("caja").build();
        session = CashSession.builder().id(10L).branch(branch).cashier(cashier)
                .openingAmount(BigDecimal.ZERO).status(CashSessionStatus.OPEN).build();

        lenient().when(cashSessionRepository.findFirstByBranchIdAndStatusOrderByOpenedAtDesc(1L, CashSessionStatus.OPEN))
                .thenReturn(Optional.of(session));
        lenient().when(saleRepository.saveAndFlush(any(Sale.class))).thenAnswer(i -> i.getArgument(0));
    }

    private Sale draftSale(String total) {
        Sale sale = Sale.builder().id(5L).branch(branch).seller(seller).status(SaleStatus.DRAFT)
                .subtotal(new BigDecimal(total)).taxTotal(BigDecimal.ZERO).grandTotal(new BigDecimal(total))
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .details(new ArrayList<>()).payments(new ArrayList<>()).build();
        sale.getDetails().add(SaleDetail.builder().sale(sale).itemDescription("Consulta")
                .unitPrice(new BigDecimal(total)).quantity(BigDecimal.ONE).lineSubtotal(new BigDecimal(total))
                .taxAmount(BigDecimal.ZERO).serviceType(BillableServiceType.OTHER_SERVICE).serviceItemId(1L).build());
        when(saleRepository.findById(5L)).thenReturn(Optional.of(sale));
        return sale;
    }

    private FinalizeSaleRequest finalizeWith(PaymentMethod method, String amount) {
        SalePaymentRequest p = new SalePaymentRequest();
        p.setMethod(method);
        p.setAmount(new BigDecimal(amount));
        FinalizeSaleRequest request = new FinalizeSaleRequest();
        request.setPayments(List.of(p));
        return request;
    }

    @Test
    void cashOverpaymentIsRecordedNetOfChange() {
        Sale sale = draftSale("100.00");

        SaleResponse response = service.finalizeSale(5L, finalizeWith(PaymentMethod.CASH, "150.00"));

        assertEquals(SaleStatus.COMPLETED, sale.getStatus());
        SalePayment payment = sale.getPayments().get(0);
        // La caja debe registrar lo que quedó (100), no lo que entregó el cliente (150)
        assertEquals(new BigDecimal("100.00"), payment.getAmountPaid());
        assertTrue(payment.getNotes().contains("Vuelto entregado: 50.00"));
        assertEquals(SaleStatus.COMPLETED, response.getStatus());
    }

    @Test
    void cardOverpaymentIsRejectedBecauseChangeCannotBeGivenInCash() {
        draftSale("100.00");

        assertThrows(BadRequestException.class,
                () -> service.finalizeSale(5L, finalizeWith(PaymentMethod.CREDIT_CARD, "150.00")));
    }

    @Test
    void paymentGoesToTheBranchOpenSessionRegardlessOfWhoSells() {
        Sale sale = draftSale("100.00");

        service.finalizeSale(5L, finalizeWith(PaymentMethod.CASH, "100.00"));

        assertSame(session, sale.getPayments().get(0).getCashSession());
    }

    @Test
    void underpaymentIsRejected() {
        draftSale("100.00");

        assertThrows(BadRequestException.class,
                () -> service.finalizeSale(5L, finalizeWith(PaymentMethod.CASH, "99.99")));
    }

    @Test
    void emptySaleCannotBeFinalized() {
        Sale sale = draftSale("0.00");
        sale.getDetails().clear();

        assertThrows(BadRequestException.class,
                () -> service.finalizeSale(5L, finalizeWith(PaymentMethod.CASH, "0.01")));
    }

    @Test
    void completedSaleWhosePaymentIsInClosedSessionCannotBeVoided() {
        Sale sale = draftSale("100.00");
        sale.setStatus(SaleStatus.COMPLETED);
        when(salePaymentRepository.countPaymentsInClosedSessions(5L)).thenReturn(1L);

        VoidSaleRequest request = new VoidSaleRequest();
        request.setReason("Error de digitación");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.voidSale(5L, request));
        assertTrue(ex.getMessage().contains("caja ya cerrada"));
        assertEquals(SaleStatus.COMPLETED, sale.getStatus());
    }

    @Test
    void completedSaleInOpenSessionCanBeVoided() {
        Sale sale = draftSale("100.00");
        sale.setStatus(SaleStatus.COMPLETED);
        when(salePaymentRepository.countPaymentsInClosedSessions(5L)).thenReturn(0L);

        VoidSaleRequest request = new VoidSaleRequest();
        request.setReason("Cliente desistió");

        service.voidSale(5L, request);

        assertEquals(SaleStatus.VOIDED, sale.getStatus());
        assertEquals("Cliente desistió", sale.getVoidReason());
    }
}

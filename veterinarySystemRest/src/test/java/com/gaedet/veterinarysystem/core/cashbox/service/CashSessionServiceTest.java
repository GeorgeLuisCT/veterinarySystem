package com.gaedet.veterinarysystem.core.cashbox.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.cashbox.dto.request.CloseCashSessionRequest;
import com.gaedet.veterinarysystem.core.cashbox.dto.request.RegisterCashMovementRequest;
import com.gaedet.veterinarysystem.core.cashbox.dto.response.CashSessionSummaryResponse;
import com.gaedet.veterinarysystem.core.cashbox.entity.CashSession;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashMovementType;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus;
import com.gaedet.veterinarysystem.core.cashbox.repository.CashSessionMovementRepository;
import com.gaedet.veterinarysystem.core.cashbox.repository.CashSessionRepository;
import com.gaedet.veterinarysystem.core.finance.service.AccountMovementService;
import com.gaedet.veterinarysystem.core.sales.entity.SalePayment;
import com.gaedet.veterinarysystem.core.sales.enums.PaymentMethod;
import com.gaedet.veterinarysystem.core.sales.repository.SalePaymentRepository;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CashSessionServiceTest {

    @Mock CashSessionRepository cashSessionRepository;
    @Mock CashSessionMovementRepository movementRepository;
    @Mock SalePaymentRepository salePaymentRepository;
    @Mock BranchRepository branchRepository;
    @Mock UserRepository userRepository;
    @Mock AccountMovementService accountMovementService;

    CashSessionService service;

    @BeforeEach
    void setUp() {
        service = new CashSessionService(cashSessionRepository, movementRepository, salePaymentRepository,
                branchRepository, userRepository, accountMovementService);
    }

    private CashSession openSession(String opening) {
        Branch branch = new Branch();
        branch.setId(1L);
        branch.setName("Central");
        return CashSession.builder().id(10L).branch(branch)
                .openingAmount(new BigDecimal(opening)).status(CashSessionStatus.OPEN).build();
    }

    private SalePayment payment(PaymentMethod method, String amount) {
        return SalePayment.builder().paymentMethod(method).amountPaid(new BigDecimal(amount)).build();
    }

    @Test
    void expectedCashOnlyCountsCashPayments() {
        CashSession session = openSession("100.00");
        when(cashSessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(salePaymentRepository.findCompletedByCashSessionId(10L))
                .thenReturn(List.of(payment(PaymentMethod.CASH, "50.00"), payment(PaymentMethod.CREDIT_CARD, "200.00")));
        when(movementRepository.findByCashSessionId(10L)).thenReturn(Collections.emptyList());
        when(salePaymentRepository.sumByCashSessionGrouped(10L)).thenReturn(List.<Object[]>of(
                new Object[]{PaymentMethod.CASH, new BigDecimal("50.00")},
                new Object[]{PaymentMethod.CREDIT_CARD, new BigDecimal("200.00")}));
        when(cashSessionRepository.save(any(CashSession.class))).thenAnswer(i -> i.getArgument(0));

        CloseCashSessionRequest request = new CloseCashSessionRequest();
        request.setCountedClosingAmount(new BigDecimal("150.00"));
        request.setPaymentTransfers(List.of(
                new CloseCashSessionRequest.PaymentTransferAllocation(PaymentMethod.CASH, 1L),
                new CloseCashSessionRequest.PaymentTransferAllocation(PaymentMethod.CREDIT_CARD, 2L)));

        CashSessionSummaryResponse summary = service.closeSession(10L, request);

        // 100 de apertura + 50 en efectivo; la tarjeta (200) NO entra al cajón
        assertEquals(new BigDecimal("150.00"), summary.getCalculatedClosingAmount());
        assertEquals(new BigDecimal("0.00"), summary.getDifferenceAmount());
        assertEquals(new BigDecimal("250.00"), summary.getTotalSales());
        verify(accountMovementService, times(2)).registerMovement(anyLong(), any(), any(), any(), any(), any());
    }

    @Test
    void cannotCloseTwice() {
        CashSession session = openSession("0.00");
        session.setStatus(CashSessionStatus.CLOSED);
        when(cashSessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));

        CloseCashSessionRequest request = new CloseCashSessionRequest();
        request.setCountedClosingAmount(BigDecimal.ZERO);

        assertThrows(BadRequestException.class, () -> service.closeSession(10L, request));
        verify(accountMovementService, never()).registerMovement(anyLong(), any(), any(), any(), any(), any());
    }

    @Test
    void expenseCannotExceedAvailableCash() {
        CashSession session = openSession("30.00");
        when(cashSessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(salePaymentRepository.findCompletedByCashSessionId(10L)).thenReturn(Collections.emptyList());
        when(movementRepository.findByCashSessionId(10L)).thenReturn(Collections.emptyList());

        RegisterCashMovementRequest request = new RegisterCashMovementRequest();
        request.setMovementType(CashMovementType.EXPENSE);
        request.setAmount(new BigDecimal("50.00"));
        request.setReason("Compra de insumos");
        request.setRegisteredById(1L);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.registerMovement(10L, request));
        assertEquals(true, ex.getMessage().contains("supera el efectivo disponible"));
    }

    @Test
    void movementAmountMustBePositive() {
        CashSession session = openSession("30.00");
        when(cashSessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));

        RegisterCashMovementRequest request = new RegisterCashMovementRequest();
        request.setMovementType(CashMovementType.INCOME);
        request.setAmount(new BigDecimal("-5.00"));
        request.setReason("Ajuste");
        request.setRegisteredById(1L);

        assertThrows(BadRequestException.class, () -> service.registerMovement(10L, request));
    }
}

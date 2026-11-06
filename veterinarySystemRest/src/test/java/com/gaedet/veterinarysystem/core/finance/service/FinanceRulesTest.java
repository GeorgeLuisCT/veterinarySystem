package com.gaedet.veterinarysystem.core.finance.service;

import com.gaedet.veterinarysystem.core.finance.dto.request.RegisterPaymentRequest;
import com.gaedet.veterinarysystem.core.finance.entity.AccountMovement;
import com.gaedet.veterinarysystem.core.finance.entity.AccountPayable;
import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;
import com.gaedet.veterinarysystem.core.finance.enums.AccountMovementType;
import com.gaedet.veterinarysystem.core.finance.enums.AccountPayableStatus;
import com.gaedet.veterinarysystem.core.finance.repository.AccountMovementRepository;
import com.gaedet.veterinarysystem.core.finance.repository.AccountPayablePaymentRepository;
import com.gaedet.veterinarysystem.core.finance.repository.AccountPayableRepository;
import com.gaedet.veterinarysystem.core.finance.repository.TreasuryAccountRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.SupplierRepository;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceRulesTest {

    @Mock AccountMovementRepository movementRepository;
    @Mock TreasuryAccountRepository treasuryRepository;
    @Mock AccountPayableRepository payableRepository;
    @Mock AccountPayablePaymentRepository paymentRepository;
    @Mock SupplierRepository supplierRepository;
    @Mock AccountMovementService accountMovementService;

    private TreasuryAccount account(boolean active) {
        return TreasuryAccount.builder().id(5L).name("Caja chica").active(active).build();
    }

    // ---- Movimientos de tesorería ----------------------------------------------------------------------------

    @Test
    void outflowCannotOverdrawAccount() {
        AccountMovementService service = new AccountMovementService(movementRepository, treasuryRepository);
        when(treasuryRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(account(true)));
        when(movementRepository.sumAmountByTreasuryAccountId(5L)).thenReturn(new BigDecimal("40.00"));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.registerMovement(
                5L, new BigDecimal("-100.00"), AccountMovementType.EXPENSE, "gasto", LocalDateTime.now(), null));

        assertTrue(ex.getMessage().contains("Saldo insuficiente"));
        verify(movementRepository, never()).save(any());
    }

    @Test
    void outflowWithinBalanceIsRegistered() {
        AccountMovementService service = new AccountMovementService(movementRepository, treasuryRepository);
        when(treasuryRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(account(true)));
        when(movementRepository.sumAmountByTreasuryAccountId(5L)).thenReturn(new BigDecimal("500.00"));
        when(movementRepository.save(any(AccountMovement.class))).thenAnswer(i -> i.getArgument(0));

        AccountMovement saved = service.registerMovement(
                5L, new BigDecimal("-100.00"), AccountMovementType.EXPENSE, "gasto", LocalDateTime.now(), null);

        assertEquals(new BigDecimal("-100.00"), saved.getAmount());
    }

    @Test
    void inactiveAccountRejectsMovements() {
        AccountMovementService service = new AccountMovementService(movementRepository, treasuryRepository);
        when(treasuryRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(account(false)));

        assertThrows(BadRequestException.class, () -> service.registerMovement(
                5L, new BigDecimal("10.00"), AccountMovementType.MANUAL_ENTRY, "x", LocalDateTime.now(), null));
    }

    // ---- Cuentas por pagar -----------------------------------------------------------------------------------

    private AccountPayableService payableService() {
        return new AccountPayableService(payableRepository, paymentRepository, supplierRepository,
                accountMovementService, treasuryRepository);
    }

    private AccountPayable payable(String total, String paid, AccountPayableStatus status) {
        return AccountPayable.builder().id(7L).description("Compra").totalAmount(new BigDecimal(total))
                .amountPaid(new BigDecimal(paid)).status(status).build();
    }

    private RegisterPaymentRequest payment(String amount) {
        RegisterPaymentRequest request = new RegisterPaymentRequest();
        request.setAmount(new BigDecimal(amount));
        request.setTreasuryAccountId(5L);
        return request;
    }

    @Test
    void paymentCannotExceedOutstandingBalance() {
        when(payableRepository.findByIdForUpdate(7L))
                .thenReturn(Optional.of(payable("100.00", "70.00", AccountPayableStatus.PARTIALLY_PAID)));
        when(treasuryRepository.findById(5L)).thenReturn(Optional.of(account(true)));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> payableService().registerPayment(7L, payment("50.00")));

        assertTrue(ex.getMessage().contains("excede el saldo pendiente"));
        verify(accountMovementService, never()).registerMovement(any(), any(), any(), any(), any(), any());
    }

    @Test
    void paidPayableRejectsNewPayments() {
        when(payableRepository.findByIdForUpdate(7L))
                .thenReturn(Optional.of(payable("100.00", "100.00", AccountPayableStatus.PAID)));
        when(treasuryRepository.findById(5L)).thenReturn(Optional.of(account(true)));

        assertThrows(BadRequestException.class, () -> payableService().registerPayment(7L, payment("1.00")));
    }
}

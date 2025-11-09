package com.gaedet.biocampovet.core.finance.service;

import com.gaedet.biocampovet.core.finance.dto.request.CreateAccountPayableRequest;
import com.gaedet.biocampovet.core.finance.dto.request.RegisterPaymentRequest;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableDetailResponse;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableSummaryResponse;
import com.gaedet.biocampovet.core.finance.entity.AccountPayable;
import com.gaedet.biocampovet.core.finance.entity.AccountPayablePayment;
import com.gaedet.biocampovet.core.finance.entity.TreasuryAccount;
import com.gaedet.biocampovet.core.finance.enums.AccountMovementType;
import com.gaedet.biocampovet.core.finance.enums.AccountPayableStatus;
import com.gaedet.biocampovet.core.finance.mapper.AccountPayableMapper;
import com.gaedet.biocampovet.core.finance.repository.AccountPayablePaymentRepository;
import com.gaedet.biocampovet.core.finance.repository.AccountPayableRepository;
import com.gaedet.biocampovet.core.finance.repository.TreasuryAccountRepository;
import com.gaedet.biocampovet.core.finance.specs.AccountPayableSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Supplier;
import com.gaedet.biocampovet.core.inventory.repository.SupplierRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountPayableService {

    private final AccountPayableRepository accountPayableRepository;
    private final AccountPayablePaymentRepository paymentRepository;
    private final SupplierRepository supplierRepository;
    private final AccountMovementService accountMovementService;

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    private final TreasuryAccountRepository treasuryAccountRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<AccountPayableSummaryResponse> list(String search,
                                                                 AccountPayableStatus status,
                                                                 Long supplierId,
                                                                 int page,
                                                                 int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<AccountPayable> paged = accountPayableRepository.findAll(
                AccountPayableSpecs.filter(search, status, supplierId),
                pageable
        );

        List<AccountPayableSummaryResponse> content = paged.map(AccountPayableMapper::toSummary).getContent();

        return PaginatedResponse.<AccountPayableSummaryResponse>builder()
                .content(content)
                .currentPage(paged.getNumber())
                .pageSize(paged.getSize())
                .totalElements(paged.getTotalElements())
                .totalPages(paged.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public AccountPayableDetailResponse getDetail(Long id) {
        AccountPayable payable = accountPayableRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta por pagar no encontrada"));
        payable.setPayments(paymentRepository.findByAccountPayableIdOrderByPaymentDateTimeDesc(id));
        return AccountPayableMapper.toDetail(payable);
    }

    @Transactional
    public AccountPayableSummaryResponse create(CreateAccountPayableRequest request) {
        Supplier supplier = resolveSupplier(request.getSupplierId());
        AccountPayable payable = AccountPayable.builder()
                .supplier(supplier)
                .description(request.getDescription().trim())
                .issueDateTime(request.getIssueDateTime())
                .totalAmount(request.getTotalAmount().setScale(MONEY_SCALE, ROUNDING_MODE))
                .amountPaid(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE))
                .status(AccountPayableStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        AccountPayable saved = accountPayableRepository.save(payable);
        return AccountPayableMapper.toSummary(saved);
    }

    @Transactional
    public AccountPayableDetailResponse registerPayment(Long accountPayableId, RegisterPaymentRequest request) {

        if (request.getTreasuryAccountId() == null) {
            throw new BadRequestException("Debe seleccionar una cuenta de tesorería");
        }

        AccountPayable payable = accountPayableRepository.findById(accountPayableId)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta por pagar no encontrada"));

        TreasuryAccount treasuryAccount = treasuryAccountRepository.findById(request.getTreasuryAccountId())
                .orElseThrow(() -> new EntityNotFoundException("Cuenta de tesorería no encontrada"));

        BigDecimal amount = request.getAmount().setScale(MONEY_SCALE, ROUNDING_MODE);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El monto debe ser mayor a cero");
        }

        AccountPayablePayment payment = AccountPayablePayment.builder()
                .accountPayable(payable)
                .amount(amount)
                .paymentDateTime(request.getPaymentDateTime() != null ? request.getPaymentDateTime() : LocalDateTime.now())
                .notes(request.getNotes())
                .treasuryAccount(treasuryAccount)
                .build();

        paymentRepository.save(payment);

        registerMovementForPayment(payment);

        if (payable.getPayments() == null) {
            payable.setPayments(new ArrayList<>());
        }
        payable.getPayments().add(payment);
        payable.setAmountPaid(payable.getAmountPaid().add(amount));
        refreshStatus(payable);

        payable = accountPayableRepository.save(payable);

        return AccountPayableMapper.toDetail(payable);
    }

    @Transactional
    public AccountPayable registerPurchasePayable(Long supplierId,
                                                  String description,
                                                  LocalDateTime issueDate,
                                                  BigDecimal totalAmount,
                                                  BigDecimal upfrontPayment,
                                                  Long treasuryAccountId,
                                                  String notes) {
        Supplier supplier = resolveSupplier(supplierId);
        AccountPayable payable = AccountPayable.builder()
                .supplier(supplier)
                .description(description)
                .issueDateTime(issueDate)
                .totalAmount(totalAmount.setScale(MONEY_SCALE, ROUNDING_MODE))
                .amountPaid(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE))
                .status(AccountPayableStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        AccountPayable saved = accountPayableRepository.save(payable);

        if (upfrontPayment != null && treasuryAccountId != null && upfrontPayment.compareTo(BigDecimal.ZERO) > 0) {
            RegisterPaymentRequest request = new RegisterPaymentRequest();
            request.setAmount(upfrontPayment);
            request.setTreasuryAccountId(treasuryAccountId);
            request.setNotes(notes);
            request.setPaymentDateTime(issueDate);
            registerPayment(saved.getId(), request);
            return accountPayableRepository.findById(saved.getId()).orElse(saved);
        }

        return saved;
    }

    private void registerMovementForPayment(AccountPayablePayment payment) {
        TreasuryAccount treasuryAccount = payment.getTreasuryAccount();

        if (treasuryAccount == null) {
            throw new IllegalStateException("El pago debe tener una cuenta de tesorería para registrar el movimiento.");
        }

        var movementDate = Optional.ofNullable(payment.getPaymentDateTime()).orElse(LocalDateTime.now());

        var movement = accountMovementService.registerMovement(
                treasuryAccount.getId(),
                payment.getAmount().negate(),
                AccountMovementType.SUPPLIER_PAYMENT,
                "Pago de cuenta por pagar #" + payment.getAccountPayable().getId(),
                movementDate,
                null
        );
    }

    private Supplier resolveSupplier(Long supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado"));
    }

    private void refreshStatus(AccountPayable payable) {
        BigDecimal total = payable.getTotalAmount();
        BigDecimal paid = payable.getAmountPaid();
        if (paid == null) {
            paid = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE);
        }
        paid = paid.setScale(MONEY_SCALE, ROUNDING_MODE);
        payable.setAmountPaid(paid);

        int comparison = paid.compareTo(total);
        if (comparison >= 0) {
            payable.setAmountPaid(total);
            payable.setStatus(AccountPayableStatus.PAID);
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            payable.setStatus(AccountPayableStatus.PARTIALLY_PAID);
        } else {
            payable.setStatus(AccountPayableStatus.PENDING);
        }
    }
}

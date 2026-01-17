package com.gaedet.veterinarysystem.core.finance.service;

import com.gaedet.veterinarysystem.core.finance.dto.request.CreateAccountMovementRequest;
import com.gaedet.veterinarysystem.core.finance.dto.request.CreateTreasuryAccountRequest;
import com.gaedet.veterinarysystem.core.finance.dto.request.UpdateTreasuryAccountRequest;
import com.gaedet.veterinarysystem.core.finance.dto.response.AccountMovementResponse;
import com.gaedet.veterinarysystem.core.finance.dto.response.TreasuryAccountResponse;
import com.gaedet.veterinarysystem.core.finance.entity.AccountMovement;
import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;
import com.gaedet.veterinarysystem.core.finance.enums.AccountMovementType;
import com.gaedet.veterinarysystem.core.finance.mapper.TreasuryAccountMapper;
import com.gaedet.veterinarysystem.core.finance.repository.AccountMovementRepository;
import com.gaedet.veterinarysystem.core.finance.repository.TreasuryAccountRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TreasuryAccountService {

    private final TreasuryAccountRepository treasuryAccountRepository;
    private final AccountMovementRepository accountMovementRepository;
    private final AccountMovementService accountMovementService;

    @Transactional(readOnly = true)
    public List<TreasuryAccountResponse> listAll() {
        return treasuryAccountRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(account -> TreasuryAccountMapper.toResponse(account, accountMovementService.getCurrentBalance(account.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TreasuryAccountResponse getById(Long id) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta de tesorería no encontrada"));
        return TreasuryAccountMapper.toResponse(account, accountMovementService.getCurrentBalance(id));
    }

    @Transactional
    public TreasuryAccountResponse create(CreateTreasuryAccountRequest request) {
        ensureUniqueName(request.getName(), null);

        TreasuryAccount account = TreasuryAccount.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .type(request.getType())
                .active(true)
                .build();

        TreasuryAccount saved = treasuryAccountRepository.save(account);
        return TreasuryAccountMapper.toResponse(saved, BigDecimal.ZERO);
    }

    @Transactional
    public TreasuryAccountResponse update(Long id, UpdateTreasuryAccountRequest request) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta de tesorería no encontrada"));

        ensureUniqueName(request.getName(), id);

        account.setName(request.getName().trim());
        account.setDescription(request.getDescription());
        account.setType(request.getType());

        return TreasuryAccountMapper.toResponse(account, accountMovementService.getCurrentBalance(id));
    }

    @Transactional
    public void delete(Long id) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta de tesorería no encontrada"));

        if (accountMovementRepository.existsByTreasuryAccountId(id)) {
            throw new BadRequestException("No se puede eliminar la cuenta porque tiene movimientos asociados");
        }

        treasuryAccountRepository.delete(account);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AccountMovementResponse> listMovements(Long accountId, int page, int size) {
        if (!treasuryAccountRepository.existsById(accountId)) {
            throw new EntityNotFoundException("Cuenta de tesorería no encontrada");
        }
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<AccountMovement> movements = accountMovementRepository.findByTreasuryAccountIdOrderByMovementDateDesc(accountId, pageable);

        List<AccountMovementResponse> content = movements.stream()
                .map(TreasuryAccountMapper::toMovementResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<AccountMovementResponse>builder()
                .content(content)
                .currentPage(movements.getNumber())
                .pageSize(movements.getSize())
                .totalElements(movements.getTotalElements())
                .totalPages(movements.getTotalPages())
                .build();
    }

    @Transactional
    public AccountMovementResponse registerManualMovement(Long accountId, CreateAccountMovementRequest request) {
        BigDecimal amount = request.getAmount();
        boolean income = request.getIncome() == null || request.getIncome();
        if (!income) {
            amount = amount.negate();
        }

        AccountMovement movement = accountMovementService.registerMovement(
                accountId,
                amount,
                AccountMovementType.MANUAL_ENTRY,
                request.getDescription(),
                request.getMovementDate(),
                null
        );

        return TreasuryAccountMapper.toMovementResponse(movement);
    }

    private void ensureUniqueName(String proposedName, Long excludeId) {
        if (proposedName == null || proposedName.isBlank()) {
            throw new BadRequestException("El nombre de la cuenta es obligatorio");
        }
        boolean exists = excludeId == null
                ? treasuryAccountRepository.existsByNameIgnoreCase(proposedName.trim())
                : treasuryAccountRepository.existsByNameIgnoreCaseAndIdNot(proposedName.trim(), excludeId);
        if (exists) {
            throw new BadRequestException("Ya existe una cuenta de tesorería con el mismo nombre");
        }
    }
}

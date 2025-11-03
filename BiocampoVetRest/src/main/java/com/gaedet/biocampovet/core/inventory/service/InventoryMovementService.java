package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.enums.AdjustmentType;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import com.gaedet.biocampovet.core.inventory.enums.KardexMovementType;
import com.gaedet.biocampovet.core.inventory.mapper.InventoryMovementMapper;
import com.gaedet.biocampovet.core.inventory.repository.*;
import com.gaedet.biocampovet.core.inventory.specs.InventoryMovementSpecs;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final KardexMovementRepository kardexMovementRepository;
    private final ProductBatchRepository productBatchRepository;
    private final KardexService kardexService;
    private final EntityManager entityManager;

    @Transactional
    public InventoryMovementResponse createPurchase(PurchaseCreateRequest request, Long employeeId) {

        InventoryMovement movement = new InventoryMovement();
        movement.setType(InventoryMovementType.PURCHASE);
        movement.setDate(request.getDate());
        movement.setSourceBranch(entityManager.getReference(Branch.class, request.getBranchId()));
        movement.setSupplier(entityManager.getReference(Supplier.class, request.getSupplierId()));
        movement.setEmployee(entityManager.getReference(Employee.class, employeeId));
        movement.setDescription(request.getDescription());

        List<InventoryMovementProduct> products = request.getProducts().stream()
                .map(p -> {
                    Product product = entityManager.getReference(Product.class, p.getProductId());

                    ProductBatch batch = findOrCreateBatch(
                            product,
                            p.getBatchNumber(),
                            p.getExpirationDate()
                    );

                    InventoryMovementProduct detail = new InventoryMovementProduct();
                    detail.setMovement(movement);
                    detail.setProduct(product);
                    detail.setProductBatch(batch);
                    detail.setQuantity(p.getQuantity());
                    detail.setUnitType(p.getUnitType());
                    detail.setUnitCost(p.getUnitCost());
                    return detail;
                }).collect(Collectors.toList());

        movement.setProducts(products);
        InventoryMovement savedMovement = movementRepository.save(movement);

        for (InventoryMovementProduct p : savedMovement.getProducts()) {
            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(p.getProduct().getId())
                    .branchId(savedMovement.getSourceBranch().getId())
                    .batchId(p.getProductBatch().getId())
                    .quantity(BigDecimal.valueOf(p.getQuantity()))
                    .unitType(p.getUnitType())
                    .type(KardexMovementType.PURCHASE_ENTRY)
                    .originId(savedMovement.getId())
                    .originType("InventoryMovement")
                    .build());
        }

        return InventoryMovementMapper.toResponse(savedMovement);
    }

    @Transactional
    public InventoryMovementResponse createTransfer(TransferCreateRequest request, Long employeeId) {

        if (request.getSourceBranchId().equals(request.getTargetBranchId())) {
            throw new BadRequestException("La sucursal de origen y destino no pueden ser la misma.");
        }

        InventoryMovement movement = new InventoryMovement();
        movement.setType(InventoryMovementType.TRANSFER);
        movement.setDate(LocalDateTime.now());
        movement.setSourceBranch(entityManager.getReference(Branch.class, request.getSourceBranchId()));
        movement.setTargetBranch(entityManager.getReference(Branch.class, request.getTargetBranchId()));
        movement.setEmployee(entityManager.getReference(Employee.class, employeeId));
        movement.setDescription(request.getDescription());

        List<InventoryMovementProduct> products = request.getProducts().stream()
                .map(p -> {
                    InventoryMovementProduct detail = new InventoryMovementProduct();
                    detail.setMovement(movement);
                    detail.setProduct(entityManager.getReference(Product.class, p.getProductId()));
                    detail.setProductBatch(entityManager.getReference(ProductBatch.class, p.getBatchId()));
                    detail.setQuantity(p.getQuantity());
                    detail.setUnitType(p.getUnitType());
                    return detail;
                }).collect(Collectors.toList());

        movement.setProducts(products);
        InventoryMovement savedMovement = movementRepository.save(movement);

        for (InventoryMovementProduct p : savedMovement.getProducts()) {
            BigDecimal quantity = BigDecimal.valueOf(p.getQuantity());

            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(p.getProduct().getId())
                    .branchId(savedMovement.getSourceBranch().getId())
                    .batchId(p.getProductBatch().getId())
                    .quantity(quantity)
                    .unitType(p.getUnitType())
                    .type(KardexMovementType.TRANSFER_EXIT)
                    .originId(savedMovement.getId())
                    .originType("InventoryMovement")
                    .build());

            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(p.getProduct().getId())
                    .branchId(savedMovement.getTargetBranch().getId())
                    .batchId(p.getProductBatch().getId())
                    .quantity(quantity)
                    .unitType(p.getUnitType())
                    .type(KardexMovementType.TRANSFER_ENTRY)
                    .originId(savedMovement.getId())
                    .originType("InventoryMovement")
                    .build());
        }

        return InventoryMovementMapper.toResponse(savedMovement);
    }

    @Transactional
    public InventoryMovementResponse createAdjustment(AdjustmentCreateRequest request, Long employeeId) {

        InventoryMovement movement = new InventoryMovement();
        movement.setType(InventoryMovementType.ADJUSTMENT);
        movement.setDate(LocalDateTime.now());
        movement.setSourceBranch(entityManager.getReference(Branch.class, request.getBranchId()));
        movement.setEmployee(entityManager.getReference(Employee.class, employeeId));
        movement.setDescription(request.getDescription());

        List<InventoryMovementProduct> products = request.getProducts().stream()
                .map(p -> {
                    InventoryMovementProduct detail = new InventoryMovementProduct();
                    detail.setMovement(movement);
                    detail.setProduct(entityManager.getReference(Product.class, p.getProductId()));
                    detail.setProductBatch(entityManager.getReference(ProductBatch.class, p.getBatchId()));
                    detail.setQuantity(p.getQuantity());
                    detail.setUnitType(p.getUnitType());
                    return detail;
                }).collect(Collectors.toList());

        movement.setProducts(products);
        InventoryMovement savedMovement = movementRepository.save(movement);

        for (int i = 0; i < savedMovement.getProducts().size(); i++) {
            InventoryMovementProduct p = savedMovement.getProducts().get(i);
            AdjustmentProductRequest reqProduct = request.getProducts().get(i);

            KardexMovementType kardexType = reqProduct.getAdjustmentType() == AdjustmentType.ENTRY ?
                    KardexMovementType.ADJUSTMENT_ENTRY :
                    KardexMovementType.ADJUSTMENT_EXIT;

            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(p.getProduct().getId())
                    .branchId(savedMovement.getSourceBranch().getId())
                    .batchId(p.getProductBatch().getId())
                    .quantity(BigDecimal.valueOf(p.getQuantity()))
                    .unitType(p.getUnitType())
                    .type(kardexType)
                    .originId(savedMovement.getId())
                    .originType("InventoryMovement")
                    .build());
        }

        return InventoryMovementMapper.toResponse(savedMovement);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<InventoryMovementSummaryResponse> listMovements(
            int page, int size, Long branchId, Collection<InventoryMovementType> types,
            LocalDate startDate, LocalDate endDate) {

        Specification<InventoryMovement> spec = InventoryMovementSpecs.byFilters(branchId, types, startDate, endDate);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("date").descending());

        Page<InventoryMovement> result = movementRepository.findAll(spec, pageable);

        List<InventoryMovementSummaryResponse> content = result.getContent().stream()
                .map(InventoryMovementMapper::toSummary)
                .toList();

        return PaginatedResponse.<InventoryMovementSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public InventoryMovementResponse getMovementById(Long id) {
        InventoryMovement movement = movementRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado: " + id));
        return InventoryMovementMapper.toResponse(movement);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<KardexMovementResponse> getKardexHistory(
            int page, int size, Long productId, Long branchId, Long batchId) {

        Specification<KardexMovement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("product").get("id"), productId));
            predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            if (batchId != null) {
                predicates.add(cb.equal(root.get("batch").get("id"), batchId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("date").descending());

        Page<KardexMovement> result = kardexMovementRepository.findAll(spec, pageable);

        List<KardexMovementResponse> content = result.getContent().stream()
                .map(InventoryMovementMapper::toKardexResponse)
                .toList();

        return PaginatedResponse.<KardexMovementResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }


    private ProductBatch findOrCreateBatch(Product product, String batchNumber, LocalDate expirationDate) {
        Optional<ProductBatch> existingBatch = productBatchRepository.findByProduct_IdAndBatchNumber(
                product.getId(),
                batchNumber
        );

        if (existingBatch.isPresent()) {
            return existingBatch.get();
        }

        ProductBatch newBatch = new ProductBatch();
        newBatch.setProduct(product);
        newBatch.setBatchNumber(batchNumber);
        newBatch.setExpirationDate(expirationDate);
        return productBatchRepository.save(newBatch);
    }
}


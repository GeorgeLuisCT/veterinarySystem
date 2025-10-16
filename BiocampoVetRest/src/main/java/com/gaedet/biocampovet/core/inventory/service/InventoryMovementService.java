package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementProductRequest;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementRequest;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementResponse;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementSummaryResponse;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import com.gaedet.biocampovet.core.inventory.mapper.InventoryMovementMapper;
import com.gaedet.biocampovet.core.inventory.repository.*;
import com.gaedet.biocampovet.core.inventory.util.InventoryStockHelper;
import com.gaedet.biocampovet.core.sales.dto.SaleProductRequest;
import com.gaedet.biocampovet.core.sales.dto.SaleRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryMovementService {

    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryMovementMapper mapper;
    private final BranchRepository branchRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductBranchStockRepository branchStockRepository;
    private final InventoryStockHelper stockHelper;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryStockHelper inventoryStockHelper;

    @Transactional
    public Long createMovement(InventoryMovementRequest request, Long sourceBranchId, Long employeeId) {
        Branch source = branchRepository.findById(sourceBranchId)
                .orElseThrow(() -> new RuntimeException("Sucursal origen no encontrada"));

        Branch target = request.getTargetBranchId() != null
                ? branchRepository.findById(request.getTargetBranchId()).orElse(null)
                : null;

        Supplier supplier = request.getSupplierId() != null
                ? supplierRepository.findById(request.getSupplierId()).orElse(null)
                : null;

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        List<Long> productIds = request.getProducts().stream()
                .map(InventoryMovementProductRequest::getProductId)
                .toList();

        List<Product> products = productRepository.findAllById(productIds);
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        List<Long> foundIds = products.stream().map(Product::getId).toList();
        List<Long> missing = productIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        if (!missing.isEmpty()) {
            throw new RuntimeException("Los siguientes productos no existen: " + missing);
        }

        InventoryMovement movement = mapper.toEntity(request, source, target, supplier, employee);
        inventoryMovementRepository.save(movement);

        boolean isIngreso = movement.getType().isIngreso();
        boolean isTransfer = movement.getType().isTransfer();

        for (InventoryMovementProduct p : movement.getProducts()) {
            Product product = productMap.get(p.getProduct().getId());
            ProductBatch batch = p.getProductBatch();

            if (isTransfer && movement.getTargetBranch() != null) {

                stockHelper.applyQuantityToBatch(product, batch, p.getQuantity(), p.getUnitType(), false);
                ProductBranchStock originStock = stockHelper.getOrCreateBranchStock(product, source, branchStockRepository);
                stockHelper.applyQuantityToBranchStock(product, originStock, p.getQuantity(), p.getUnitType(), false);

                ProductBatch destBatch = stockHelper.getOrCreateBatch(
                        product.getId(),
                        movement.getTargetBranch().getId(),
                        batch.getBatchNumber(),
                        batch.getExpirationDate()
                );
                ProductBranchStock destStock = stockHelper.getOrCreateBranchStock(product, movement.getTargetBranch(), branchStockRepository);
                stockHelper.applyQuantityToBatch(product, destBatch, p.getQuantity(), p.getUnitType(), true);
                stockHelper.applyQuantityToBranchStock(product, destStock, p.getQuantity(), p.getUnitType(), true);
            } else {
                stockHelper.applyQuantityToBatch(product, batch, p.getQuantity(), p.getUnitType(), isIngreso);
                ProductBranchStock branchStock = stockHelper.getOrCreateBranchStock(product, source, branchStockRepository);
                stockHelper.applyQuantityToBranchStock(product, branchStock, p.getQuantity(), p.getUnitType(), isIngreso);
            }
        }

        return movement.getId();
    }

    @Transactional
    public void registerSaleMovement(SaleRequest request, Long branchId, Long employeeId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        InventoryMovement movement = new InventoryMovement();
        movement.setType(InventoryMovementType.SALE);
        movement.setDate(LocalDateTime.now());
        movement.setSourceBranch(branch);
        movement.setEmployee(employee);
        movement.setDescription("Movimiento generado desde venta");

        List<InventoryMovementProduct> products = new ArrayList<>();

        for (SaleProductRequest sp : request.getSaleProducts()) {
            Product product = productRepository.findById(sp.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            ProductBatch batch = productBatchRepository
                    .findFirstAvailableBatchByProductIdAndBranchIdOrderByExpirationDateAsc(product.getId(), branchId)
                    .orElseThrow(() -> new RuntimeException("No hay stock disponible para el producto: " + product.getName()));

            InventoryMovementProduct imp = new InventoryMovementProduct();
            imp.setProduct(product);
            imp.setProductBatch(batch);
            imp.setQuantity(sp.getQuantityEquivalent());
            imp.setUnitType(sp.getUnitType());
            imp.setMovement(movement);

            products.add(imp);

            inventoryStockHelper.applyQuantityToBatch(product, batch, sp.getQuantityEquivalent(), sp.getUnitType(), false);

            ProductBranchStock stock = inventoryStockHelper.getOrCreateBranchStock(product, branch, branchStockRepository);
            inventoryStockHelper.applyQuantityToBranchStock(product, stock, sp.getQuantityEquivalent(), sp.getUnitType(), false);
        }

        movement.setProducts(products);
        inventoryMovementRepository.save(movement);
    }


    public InventoryMovementResponse getMovementById(Long id) {
        InventoryMovement movement = inventoryMovementRepository.findDetailedById(id)
                .orElseThrow(() -> new NoSuchElementException("Movimiento no encontrado con ID: " + id));
        return mapper.toResponse(movement);
    }

    public PaginatedResponse<InventoryMovementSummaryResponse> getMovementSummariesByTypes(
            int page,
            int size,
            Long branchId,
            List<InventoryMovementType> types,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        List<String> typesStr = types.stream()
                .map(Enum::name)
                .toList();

        Pageable pageable = PageRequest.of(page, size);
        Page<Object[]> rawPage = inventoryMovementRepository.findMovementSummariesByTypes(
                branchId, typesStr, startDate, endDate, pageable
        );

        Page<InventoryMovementSummaryResponse> responsePage =
                rawPage.map(InventoryMovementSummaryResponse::fromNativeRow);

        return PaginatedResponse.<InventoryMovementSummaryResponse>builder()
                .content(responsePage.getContent())
                .totalPages(responsePage.getTotalPages())
                .totalElements(responsePage.getTotalElements())
                .currentPage(responsePage.getNumber())
                .pageSize(responsePage.getSize())
                .build();
    }
}


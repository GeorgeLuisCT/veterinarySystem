package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBatch;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranchStock;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.ProductBatchRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductBranchStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class InventoryStockHelper {

    private final ProductBatchRepository productBatchRepository;

    public ProductBatch getOrCreateBatch(Long productId, Long branchId, String batchNumber, LocalDate expirationDate) {
        return productBatchRepository.findByProductIdAndBranchIdAndBatchNumber(productId, branchId, batchNumber)
                .orElseGet(() -> {
                    Product product = new Product();
                    product.setId(productId);

                    Branch branch = new Branch();
                    branch.setId(branchId);

                    ProductBatch newBatch = new ProductBatch();
                    newBatch.setProduct(product);
                    newBatch.setBranch(branch);
                    newBatch.setBatchNumber(batchNumber);
                    newBatch.setExpirationDate(expirationDate);
                    newBatch.setStockUnits(0);
                    newBatch.setStockFractional(0.0);
                    return productBatchRepository.save(newBatch);
                });
    }

    public void applyQuantityToBatch(Product product, ProductBatch batch, double quantity, ProductUnitType movementUnit, boolean isIngreso) {
        double effectiveQty = ProductUnitTypeValidator.calculateEffectiveQuantity(
                product, movementUnit, quantity
        );

        if (product.getUnitType() == movementUnit) {
            int delta = (int) effectiveQty;
            batch.setStockUnits(batch.getStockUnits() + (isIngreso ? delta : -delta));
        } else {
            batch.setStockFractional(batch.getStockFractional() + (isIngreso ? effectiveQty : -effectiveQty));
        }
    }

    public void applyQuantityToBranchStock(
            Product product,
            ProductBranchStock branchStock,
            double quantity,
            ProductUnitType movementUnit,
            boolean isIngreso
    ) {
        double effectiveQty = ProductUnitTypeValidator.calculateEffectiveQuantity(
                product, movementUnit, quantity
        );

        if (product.getUnitType() == movementUnit) {
            int delta = (int) effectiveQty;
            branchStock.setStockUnits(branchStock.getStockUnits() + (isIngreso ? delta : -delta));
        } else {
            branchStock.setStockFractional(branchStock.getStockFractional() + (isIngreso ? effectiveQty : -effectiveQty));
        }
    }

    public ProductBranchStock getOrCreateBranchStock(Product product, Branch branch, ProductBranchStockRepository repository) {
        return repository.findByProductIdAndBranchId(product.getId(), branch.getId())
                .orElseGet(() -> repository.save(ProductBranchStock.builder()
                        .product(product)
                        .branch(branch)
                        .stockUnits(0)
                        .stockFractional(0.0)
                        .isActive(true)
                        .build()));
    }
}


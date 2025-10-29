package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;

import java.util.List;
import java.util.Set;

public final class ProductBranchMapper {

    public static Set<ProductBranch> toEntitySet(Product product, List<Branch> allBranches, Set<Long> branchIds) {
        Set<Long> activeBranchIds = branchIds == null
                ? java.util.Collections.emptySet()
                : new java.util.HashSet<>(branchIds);

        return allBranches.stream()
                .map(branch -> ProductBranch.builder()
                        .branch(branch)
                        .product(product)
                        .isActive(activeBranchIds.contains(branch.getId()))
                        .build())
                .collect(java.util.stream.Collectors.toSet());
    }
}

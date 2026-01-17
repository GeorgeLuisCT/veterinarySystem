package com.gaedet.veterinarysystem.core.inventory.mapper;

import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductRequest;
import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductResponse;
import com.gaedet.veterinarysystem.core.inventory.entity.CategoryProduct;

public final class CategoryProductMapper {

    public static CategoryProduct toEntity(CategoryProductRequest request) {
        return CategoryProduct.builder()
                .name(request.getName())
                .isActive(true)
                .build();
    }

    public  static CategoryProductResponse toResponse(CategoryProduct categoryProduct) {
        return CategoryProductResponse.builder()
                .id(categoryProduct.getId())
                .name(categoryProduct.getName())
                .isActive(categoryProduct.isActive())
                .build();
    }
}

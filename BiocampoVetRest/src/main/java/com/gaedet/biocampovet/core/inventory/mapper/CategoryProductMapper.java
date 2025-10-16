package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.inventory.dto.CategoryProductRequest;
import com.gaedet.biocampovet.core.inventory.dto.CategoryProductResponse;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import org.springframework.stereotype.Component;

@Component
public class CategoryProductMapper {

    public CategoryProduct toEntity(CategoryProductRequest request) {
        return CategoryProduct.builder()
                .name(request.getName())
                .isActive(true)
                .build();
    }

    public CategoryProductResponse toResponse(CategoryProduct categoryProduct) {
        return CategoryProductResponse.builder()
                .id(categoryProduct.getId())
                .name(categoryProduct.getName())
                .isActive(categoryProduct.isActive())
                .build();
    }
}

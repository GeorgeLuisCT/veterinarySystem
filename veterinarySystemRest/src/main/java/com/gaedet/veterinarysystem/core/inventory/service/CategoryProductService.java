package com.gaedet.veterinarysystem.core.inventory.service;



import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.CategoryProduct;
import com.gaedet.veterinarysystem.core.inventory.repository.CategoryProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryProductService {

    private final CategoryProductRepository categoryRepository;

    public CategoryProductService(CategoryProductRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryProductResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::convertToCategoryDTO)
                .collect(Collectors.toList());
    }

    public CategoryProductResponse getById(Long id) {
        return categoryRepository.findById(id)
                .map(this::convertToCategoryDTO)
                .orElse(null);
    }

    public CategoryProductResponse save(CategoryProductRequest categoryProduct) {
        CategoryProduct category = convertToCategory(categoryProduct);
        return convertToCategoryDTO(categoryRepository.save(category));
    }

    public CategoryProductResponse updateName(Long id, String newName) {
        return categoryRepository.findById(id).map(category -> {
            category.setName(newName);
            return convertToCategoryDTO(categoryRepository.save(category));
        }).orElse(null);
    }

    public boolean softDelete(Long id) {
        return categoryRepository.findById(id).map(category -> {
            category.setActive(false);
            categoryRepository.save(category);
            return true;
        }).orElse(false);
    }

    public boolean hardDelete(Long id) {
        if (!categoryRepository.existsById(id)) {
            return false;
        }
        categoryRepository.deleteById(id);
        return true;
    }

    public boolean restore(Long id) {
        return categoryRepository.findById(id).map(category -> {
            category.setActive(true);
            categoryRepository.save(category);
            return true;
        }).orElse(false);
    }

    private CategoryProductResponse convertToCategoryDTO(CategoryProduct category) {
        return CategoryProductResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .isActive(category.isActive())
                .build();
    }

    private CategoryProduct convertToCategory(CategoryProductRequest categoryProductRequest) {
        return CategoryProduct.builder()
                .name(categoryProductRequest.getName())
                .build();
    }
}

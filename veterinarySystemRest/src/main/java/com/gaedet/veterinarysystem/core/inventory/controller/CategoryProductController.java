package com.gaedet.veterinarysystem.core.inventory.controller;


import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.CategoryProductRequest;
import com.gaedet.veterinarysystem.core.inventory.service.CategoryProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/products/categories")
public class CategoryProductController {

    private final CategoryProductService categoryService;

    public CategoryProductController(CategoryProductService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryProductResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @GetMapping("/get")
    public ResponseEntity<CategoryProductResponse> getById(@RequestParam Long id) {
        CategoryProductResponse category = categoryService.getById(id);
        return (category != null) ? ResponseEntity.ok(category) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<CategoryProductResponse> save(@Valid @RequestBody CategoryProductRequest productRequest) {
        return ResponseEntity.ok(categoryService.save(productRequest));
    }

    @PutMapping("/update-name")
    public ResponseEntity<CategoryProductResponse> updateCategoryName(@RequestParam Long id, @RequestParam String name) {
        CategoryProductResponse updatedCategory = categoryService.updateName(id, name);
        return updatedCategory != null ? ResponseEntity.ok(updatedCategory) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/soft")
    public ResponseEntity<Void> softDelete(@RequestParam Long id) {
        return categoryService.softDelete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/hard")
    public ResponseEntity<Void> hardDelete(@RequestParam Long id) {
        return categoryService.hardDelete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/restore")
    public ResponseEntity<Void> restore(@RequestParam Long id) {
        return categoryService.restore(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}

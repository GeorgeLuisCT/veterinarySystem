package com.gaedet.biocampovet.core.inventory.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.*;

import com.gaedet.biocampovet.core.inventory.service.ProductService;
import com.gaedet.biocampovet.security.annotations.BranchAccessRequired;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final JwtTokenProvider jwtTokenProvider;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/create")
    public ResponseEntity<ProductSummaryResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @GetMapping("/get")
    public ResponseEntity<ProductResponse> getProduct(@RequestParam Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @PostMapping("/by-ids")
    public ResponseEntity<List<ProductResponse>> getProductsByIds(@RequestBody List<Long> ids) {
        return ResponseEntity.ok(productService.getProducts(ids));
    }

    @BranchAccessRequired
    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<ProductSummaryResponse>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam boolean active,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(productService.getProducts( page, size, active, branchId, query));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<ProductQuickSearchResponse>> searchProductsByName(@RequestParam String name,
                                                                      @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(productService.searchProductsByName(name, branchId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/update")
    public ResponseEntity<ProductSummaryResponse> updateProduct(@RequestBody @Valid ProductUpdateRequest request) {
        return ResponseEntity.ok(productService.updateProduct(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/soft-delete")
    public ResponseEntity<Map<String, String>> softDeleteProduct(@RequestParam Long id,
                                                                 @RequestParam(required = false) Long branchId) {

        productService.softDeleteProduct(id, branchId);
        return ResponseEntity.ok(Map.of("message", "Producto desavilitado correctamente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/hard-delete")
    public ResponseEntity<Map<String, String>> hardDeleteProduct(@RequestParam Long id) {
        productService.hardDeleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Producto eliminado permanentemente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/restore")
    public ResponseEntity<ProductSummaryResponse> activateProduct(@RequestParam Long id,
                                                                  @RequestParam(required = false) Long branchId) {
        ProductSummaryResponse response = productService.restoreProduct(id, branchId);
        return ResponseEntity.ok(response);
    }
}

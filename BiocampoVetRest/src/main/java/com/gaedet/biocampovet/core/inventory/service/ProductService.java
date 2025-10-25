package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.CategoryProductRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import com.gaedet.biocampovet.core.inventory.mapper.ProductMapper;
import com.gaedet.biocampovet.core.inventory.specs.ProductSpecs;
import com.gaedet.biocampovet.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryProductRepository categoryRepository;
    private final EntityManager entityManager;
    private final SaleModeService saleModeService;
    private final KardexService kardexService;

    ProductService(ProductRepository productRepository, CategoryProductRepository categoryRepository,
                   EntityManager entityManager, SaleModeService saleModeService, KardexService kardexService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.entityManager = entityManager;
        this.saleModeService = saleModeService;
        this.kardexService = kardexService;
    }

    @Transactional
    public ProductSummaryResponse createProduct(ProductCreateRequest request) {

        if (productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("El SKU ya está en uso");
        }

        CategoryProduct category = entityManager.getReference(CategoryProduct.class, request.getCategoryId());

        List<Branch> allBranches = entityManager.createQuery("SELECT b FROM Branch b", Branch.class)
                .getResultList();

        Product product = productRepository.save(ProductMapper.toEntity(request, category, allBranches));

        return ProductMapper.toSummary(product);
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return ProductMapper.toResponse(product);
    }

    public List<ProductResponse> getProducts(List<Long> ids) {
        List<Product> products = productRepository.findAllWithDetailsByIdIn(ids);

        if (products.size() != ids.size()) {
            throw new RuntimeException("Uno o más productos no fueron encontrados");
        }

        return products.stream()
                .map(ProductMapper::toResponse)
                .collect(Collectors.toList());
    }

    public PaginatedResponse<ProductSummaryResponse> list(
            int page, int size,
            String q,
            Long categoryId,
            Long branchId,
            Boolean active,
            ProductPresentationType presentation,
            ProductUnitType unitType,
            AdministrationRoute route,
            Boolean hasSaleModes,
            Boolean availableOnly,
            Boolean minStockAlertOnly
    ) {
        Specification<Product> spec = ProductSpecs.byFilters(
                q, categoryId, branchId, active, presentation, unitType, route, hasSaleModes, availableOnly, minStockAlertOnly
        );

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<Product> result = productRepository.findAll(spec, pageable);

        List<ProductSummaryResponse> content = result.getContent().stream()
                .map(ProductMapper::toSummary)
                .toList();

        return PaginatedResponse.<ProductSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    public List<ProductQuickSearchResponse> searchProductsByName(String name, Long branchId) {
        String searchQuery = (name == null || name.isBlank()) ? null : name.trim();
        Long formattedBranchId = (branchId == null || branchId == 0) ? null : branchId;

        List<Object[]> rawResults = productRepository.quickProductSearch(searchQuery, formattedBranchId, true);

        return rawResults.stream()
                .map(ProductQuickSearchResponse::fromNativeRow)
                .toList();
    }

    @Transactional
    public ProductSummaryResponse updateProduct(ProductUpdateRequest request) {
        Product product = productRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        CategoryProduct category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        if (productRepository.existsBySkuAndIdNot(request.getSku(), request.getId())) {
            throw new BadRequestException("El SKU ya está en uso por otro producto");
        }

        saleModeService.deleteUnnecessarySaleModes(product, request);

        ProductMapper.updateEntity(product, request, category);

        saleModeService.updateOrAddSaleModes(product, request);

        productRepository.save(product);
        return ProductMapper.toSummary(product);
    }

    @Transactional
    public void softDeleteProduct(Long productId, Long branchId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (branchId == null || branchId == 0) {

            for (ProductBranch stock : product.getBranchStocks()) {
                BigDecimal currentStock = kardexService.getCurrentStock(productId, stock.getBranch().getId());
                if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                    throw new RuntimeException("No se puede desactivar el producto. Tiene stock en la sucursal: " + stock.getBranch().getName());
                }
                stock.setActive(false);
            }

        } else {
            ProductBranch branchStock = product.getBranchStocks().stream()
                    .filter(stock -> stock.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este producto."));

            BigDecimal currentStock = kardexService.getCurrentStock(productId, branchId);
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                throw new RuntimeException("No se puede desactivar el producto porque tiene stock disponible en la sucursal.");
            }

            branchStock.setActive(false);
        }
    }

    @Transactional
    public void hardDeleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        for (ProductBranch stock : product.getBranchStocks()) {
            BigDecimal currentStock = kardexService.getCurrentStock(productId, stock.getBranch().getId());
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                throw new RuntimeException("No se puede eliminar el producto. Tiene stock en la sucursal: " + stock.getBranch().getName());
            }
        }

        productRepository.deleteById(productId);
    }

    @Transactional
    public ProductSummaryResponse restoreProduct(Long productId, Long branchId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (branchId == null || branchId == 0) {
            product.getBranchStocks().forEach(stock -> stock.setActive(true));
        } else {
            ProductBranch branchStock = product.getBranchStocks().stream()
                    .filter(stock -> stock.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este producto."));

            branchStock.setActive(true);
        }

        productRepository.save(product);
        return ProductMapper.toSummary(product);
    }
}
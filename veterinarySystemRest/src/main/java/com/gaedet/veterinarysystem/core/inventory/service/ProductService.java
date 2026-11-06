package com.gaedet.veterinarysystem.core.inventory.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.*;
import com.gaedet.veterinarysystem.core.inventory.entity.CategoryProduct;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductBranch;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductSaleMode;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductPresentationType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.inventory.mapper.ProductBranchMapper;
import com.gaedet.veterinarysystem.core.inventory.mapper.ProductSaleModeMapper;
import com.gaedet.veterinarysystem.core.inventory.repository.CategoryProductRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import com.gaedet.veterinarysystem.core.inventory.mapper.ProductMapper;
import com.gaedet.veterinarysystem.core.inventory.specs.ProductSpecs;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import javax.persistence.EntityNotFoundException;

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

        Product product = ProductMapper.toEntity(request, category);

        List<Branch> allBranches = entityManager.createQuery("SELECT b FROM Branch b", Branch.class)
                .getResultList();

        Set<ProductBranch> branchStocks = ProductBranchMapper.toEntitySet(product, allBranches, request.getBranchIds());
        product.setBranchStocks(branchStocks);

        Set<ProductSaleMode> saleModes = ProductSaleModeMapper.toEntitySet(product, request);
        product.setSaleModes(saleModes);

        Product savedProduct = productRepository.save(product);

        return ProductMapper.toSummary(
                savedProduct,
                BigDecimal.ZERO,
                Collections.emptyMap()
        );
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        Map<Long, BigDecimal> totalStockData = kardexService.getStockForProducts(List.of(id), null);
        BigDecimal totalStockBaseUnit = totalStockData.getOrDefault(id, BigDecimal.ZERO);

        Map<Long, Map<Long, BigDecimal>> allBranchStockData = kardexService.getAggregatedBranchStock(List.of(id));
        Map<Long, BigDecimal> branchStockMap = allBranchStockData.getOrDefault(id, Collections.emptyMap());

        return ProductMapper.toResponse(product, totalStockBaseUnit, branchStockMap);
    }

    public List<ProductResponse> getProducts(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> products = productRepository.findAllWithDetailsByIdIn(ids);

        if (products.size() != ids.size()) {
            throw new BadRequestException("Uno o más productos no fueron encontrados");
        }

        Map<Long, BigDecimal> totalStockData = kardexService.getStockForProducts(ids, null);

        Map<Long, Map<Long, BigDecimal>> allBranchStockData = kardexService.getAggregatedBranchStock(ids);

        return products.stream()
                .map(product -> {
                    BigDecimal totalStock = totalStockData.getOrDefault(product.getId(), BigDecimal.ZERO);
                    Map<Long, BigDecimal> branchStockMap = allBranchStockData.getOrDefault(product.getId(), Collections.emptyMap());

                    return ProductMapper.toResponse(
                            product,
                            totalStock,
                            branchStockMap
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
                q, categoryId, branchId, active, presentation, unitType, route, hasSaleModes
        );

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());
        Page<Product> paged = productRepository.findAll(spec, pageable);

        List<Long> pageIds = paged.getContent().stream().map(Product::getId).toList();
        if (pageIds.isEmpty()) {
            return PaginatedResponse.<ProductSummaryResponse>builder()
                    .content(List.of())
                    .totalPages(paged.getTotalPages())
                    .totalElements(paged.getTotalElements())
                    .currentPage(paged.getNumber())
                    .pageSize(paged.getSize())
                    .build();
        }

        Map<Long, Integer> order = new HashMap<>();
        for (int i = 0; i < pageIds.size(); i++) order.put(pageIds.get(i), i);

        List<Product> products = productRepository.findAllByIdIn(pageIds);
        products.sort(Comparator.comparingInt(p -> order.get(p.getId())));

        Map<Long, Map<Long, BigDecimal>> branchStockData = kardexService.getAggregatedBranchStock(pageIds);

        final Map<Long, BigDecimal> mainStockData;
        if (branchId != null && branchId != 0) {
            mainStockData = kardexService.getStockForProducts(pageIds, branchId);
        } else {
            mainStockData = branchStockData.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue().values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    ));
        }

        List<ProductSummaryResponse> content = products.stream()
                .map(p -> ProductMapper.toSummary(
                        p,
                        mainStockData.getOrDefault(p.getId(), BigDecimal.ZERO),
                        branchStockData.get(p.getId())
                ))
                .toList();

        if (Boolean.TRUE.equals(availableOnly)) {
            content = content.stream().filter(ProductSummaryResponse::getIsAvailable).toList();
        }
        if (Boolean.TRUE.equals(minStockAlertOnly)) {
            content = content.stream().filter(ProductSummaryResponse::getIsBelowMinStock).toList();
        }

        return PaginatedResponse.<ProductSummaryResponse>builder()
                .content(content)
                .totalPages(paged.getTotalPages())
                .totalElements(paged.getTotalElements())
                .currentPage(paged.getNumber())
                .pageSize(paged.getSize())
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
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        CategoryProduct category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));

        if (productRepository.existsBySkuAndIdNot(request.getSku(), request.getId())) {
            throw new BadRequestException("El SKU ya está en uso por otro producto");
        }

        saleModeService.deleteUnnecessarySaleModes(product, request);

        ProductMapper.updateEntity(product, request, category);

        saleModeService.updateOrAddSaleModes(product, request);

        productRepository.save(product);
        return fetchStockAndMapToSummary(product);
    }

    @Transactional
    public void softDeleteProduct(Long productId, Long branchId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        if (branchId == null || branchId == 0) {

            for (ProductBranch stock : product.getBranchStocks()) {
                BigDecimal currentStock = kardexService.getCurrentStock(productId, stock.getBranch().getId());
                if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                    throw new BadRequestException("No se puede desactivar el producto. Tiene stock en la sucursal: " + stock.getBranch().getName());
                }
                stock.setActive(false);
            }

        } else {
            ProductBranch branchStock = product.getBranchStocks().stream()
                    .filter(stock -> stock.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada para este producto."));

            BigDecimal currentStock = kardexService.getCurrentStock(productId, branchId);
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                throw new BadRequestException("No se puede desactivar el producto porque tiene stock disponible en la sucursal.");
            }

            branchStock.setActive(false);
        }
    }

    @Transactional
    public void hardDeleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        for (ProductBranch stock : product.getBranchStocks()) {
            BigDecimal currentStock = kardexService.getCurrentStock(productId, stock.getBranch().getId());
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                throw new BadRequestException("No se puede eliminar el producto. Tiene stock en la sucursal: " + stock.getBranch().getName());
            }
        }

        productRepository.deleteById(productId);
    }

    @Transactional
    public ProductSummaryResponse restoreProduct(Long productId, Long branchId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        if (branchId == null || branchId == 0) {
            product.getBranchStocks().forEach(stock -> stock.setActive(true));
        } else {
            ProductBranch branchStock = product.getBranchStocks().stream()
                    .filter(stock -> stock.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada para este producto."));

            branchStock.setActive(true);
        }

        Product savedProduct = productRepository.save(product);

        return fetchStockAndMapToSummary(savedProduct);
    }

    private ProductSummaryResponse fetchStockAndMapToSummary(Product product) {
        Long productId = product.getId();

        Map<Long, BigDecimal> totalStockData = kardexService.getStockForProducts(List.of(productId), null);
        BigDecimal totalStockBaseUnit = totalStockData.getOrDefault(productId, BigDecimal.ZERO);

        Map<Long, Map<Long, BigDecimal>> allBranchStockData = kardexService.getAggregatedBranchStock(List.of(productId));
        Map<Long, BigDecimal> branchStockMap = allBranchStockData.getOrDefault(productId, Collections.emptyMap());

        return ProductMapper.toSummary(product, totalStockBaseUnit, branchStockMap);
    }
}

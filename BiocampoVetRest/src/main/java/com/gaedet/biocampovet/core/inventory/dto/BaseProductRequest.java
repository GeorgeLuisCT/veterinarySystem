package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseProductRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no debe exceder los 100 caracteres")
    private String name;

    @NotBlank(message = "La descripción no puede estar vacía")
    private String description;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo debe ser al menos 0")
    private Integer minStock;

    @NotNull(message = "El ID de la categoría es obligatorio")
    private Long categoryId;

    @NotBlank(message = "El SKU no puede estar vacío")
    @Size(max = 50, message = "El SKU no debe exceder los 50 caracteres")
    private String sku;

    @NotNull(message = "La presentación del producto es obligatoria")
    private ProductPresentationType presentation;

    @NotNull(message = "La unidad base es obligatoria")
    private ProductUnitType baseUnitType;

    @NotNull(message = "La unidad principal es obligatoria")
    private ProductUnitType mainUnitType;

    @NotNull(message = "El precio estándar es obligatorio")
    private BigDecimal standardPrice;

    @NotNull(message = "El contenido total es obligatorio")
    @DecimalMin(value = "0.01", message = "El contenido total debe ser mayor a 0")
    private Double contentTotal;

    private Set<AdministrationRoute> administrationRoutes;

    private Set<ProductSaleModeRequest> saleModes;
}

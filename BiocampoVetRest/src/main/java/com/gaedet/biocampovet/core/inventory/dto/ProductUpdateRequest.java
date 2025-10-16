package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.validation.constraints.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductUpdateRequest extends BaseProductRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long id;
}
package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class InventoryMovementRequest {

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private InventoryMovementType type;

    private Long sourceBranchId;

    @NotNull(message = "El ID de la sucursal origen es obligatorio")
    private Long targetBranchId;

    private Long supplierId;

    private String description;

    @NotEmpty(message = "Debe registrar al menos un producto")
    @Valid
    private List<InventoryMovementProductRequest> products;
}

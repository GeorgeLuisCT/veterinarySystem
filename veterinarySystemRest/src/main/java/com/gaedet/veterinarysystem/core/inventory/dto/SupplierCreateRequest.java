package com.gaedet.veterinarysystem.core.inventory.dto;


import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SupplierCreateRequest extends BaseSupplierRequest {
    // Por ahora no se requiere campo adicional
}

package com.gaedet.biocampovet.core.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CustomerUpdateRequest extends BaseCustomerRequest {

    @NotNull(message = "El ID del cliente es obligatorio")
    private Long id;
}

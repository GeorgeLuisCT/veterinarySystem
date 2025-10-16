package com.gaedet.biocampovet.core.sales.dto;

import javax.validation.constraints.NotNull;
import java.util.List;

import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleRequest {

    private Long customerId;

    private List<SaleProductRequest> saleProducts;

    private List<SalePaymentRequest> salePayments;

    @NotNull(message = "El estado de la venta es obligatorio")
    private SaleStatus status;
}

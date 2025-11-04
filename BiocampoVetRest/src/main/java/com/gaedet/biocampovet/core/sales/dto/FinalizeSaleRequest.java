package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.sales.dto.request.SalePaymentRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalizeSaleRequest {

    // Permite agregar pagos en el momento de finalizar
    @Builder.Default
    private List<@Valid SalePaymentRequest> payments = new ArrayList<>();
}
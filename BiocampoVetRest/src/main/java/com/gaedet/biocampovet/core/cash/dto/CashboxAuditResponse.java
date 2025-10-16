package com.gaedet.biocampovet.core.cash.dto;

import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashboxAuditResponse {

    private Long id;
    private boolean isFinal;
    private String observations;
    private UserSummaryResponse auditedBy;
    private LocalDateTime auditedAt;
    private List<CashboxAuditPaymentMethodResponse> paymentMethodAudits;
}
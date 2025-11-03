package com.gaedet.biocampovet.core.payments.dto.response;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CashSessionDetailResponse {
    CashSessionSummaryResponse session;
    @Singular
    List<CashMovementResponse> movements;
}


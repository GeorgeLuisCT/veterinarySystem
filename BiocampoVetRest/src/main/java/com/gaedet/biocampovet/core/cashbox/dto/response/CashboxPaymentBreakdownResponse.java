package com.gaedet.biocampovet.core.cashbox.dto.response;

import com.gaedet.biocampovet.core.finance.enums.CashboxTransferChannel;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class CashboxPaymentBreakdownResponse {
    CashboxTransferChannel channel;
    String label;
    BigDecimal amount;
}

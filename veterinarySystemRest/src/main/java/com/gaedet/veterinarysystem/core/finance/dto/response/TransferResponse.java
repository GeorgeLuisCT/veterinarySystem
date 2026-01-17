package com.gaedet.veterinarysystem.core.finance.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TransferResponse {
    AccountMovementResponse sourceMovement;
    AccountMovementResponse destinationMovement;
}

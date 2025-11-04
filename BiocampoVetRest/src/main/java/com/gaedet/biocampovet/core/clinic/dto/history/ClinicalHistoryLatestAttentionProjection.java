package com.gaedet.biocampovet.core.clinic.dto.history;

import java.time.LocalDateTime;

public interface ClinicalHistoryLatestAttentionProjection {
    Long getAnimalId();
    Long getClinicalAttentionId();
    LocalDateTime getVisitDate();
}

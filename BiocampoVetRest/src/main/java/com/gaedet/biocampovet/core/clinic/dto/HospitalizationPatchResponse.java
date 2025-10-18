package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
public class HospitalizationPatchResponse {
    private Long id;
    private int version;
    private HospitalizationStatus status;
    private Map<String, Object> updated;
}

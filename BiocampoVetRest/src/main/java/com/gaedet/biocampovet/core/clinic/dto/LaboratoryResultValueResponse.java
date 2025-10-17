package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryResultValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryResultValueResponse {
    private Long id;
    private Long parameterId;
    private String parameterName;
    private Double numericValue;
    private String textValue;
    private Boolean booleanValue;
    private String unitOverride;
    private Boolean outOfRange;
    private String flag;
    private String comment;

    public static LaboratoryResultValueResponse fromEntity(LaboratoryResultValue entity) {
        return LaboratoryResultValueResponse.builder()
                .id(entity.getId())
                .parameterId(entity.getParameter().getId())
                .parameterName(entity.getParameter().getName())
                .numericValue(entity.getNumericValue())
                .textValue(entity.getTextValue())
                .booleanValue(entity.getBooleanValue())
                .unitOverride(entity.getUnitOverride())
                .outOfRange(entity.getOutOfRange())
                .flag(entity.getFlag())
                .comment(entity.getComment())
                .build();
    }
}

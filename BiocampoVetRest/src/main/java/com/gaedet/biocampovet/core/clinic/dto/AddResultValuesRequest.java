package com.gaedet.biocampovet.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddResultValuesRequest {

    @Valid
    @NotNull
    private List<ResultValueItem> results;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultValueItem {
        @NotNull
        private Long parameterId;
        private Double numericValue;
        private String textValue;
        private Boolean booleanValue;
        private String comment;
    }
}

package com.gaedet.biocampovet.core.branches.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicCompanyResponse {
    private String name;
    private String industry;
}
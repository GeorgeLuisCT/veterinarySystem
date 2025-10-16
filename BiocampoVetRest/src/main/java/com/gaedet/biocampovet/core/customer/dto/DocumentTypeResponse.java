package com.gaedet.biocampovet.core.customer.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTypeResponse {
    private Long id;
    private String name;
    private String abbreviation;
}

package com.gaedet.biocampovet.core.animal.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalSpeciesResponse {

    private Long id;
    private String name;
}

package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceGroupInput {
    @NotNull
    private AnimalSpecies species;

    @Size(max = 255)
    private String breed;

    @NotNull
    @Min(1)
    private Integer quantity;

    @Size(max = 1000)
    private String description;
}

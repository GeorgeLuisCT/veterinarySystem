package com.gaedet.veterinarysystem.core.clinic.dto;

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
public class CreateLaboratoryRequest {

    @NotNull
    private Long animalId;

    @NotNull
    private Long laboratoryId;

    private Long requestingEmployeeId;

    private String clinicalNotes;

    @Valid
    @NotNull
    private List<AddClinicalAttentionLaboratoryRequest.Item> items;
}

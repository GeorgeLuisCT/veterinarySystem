package com.gaedet.veterinarysystem.core.animal.dto;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseAnimalRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no debe exceder los 100 caracteres")
    private String name;

    @NotNull(message = "El dueño del animal es obligatorio")
    private Long ownerId;

    @NotNull(message = "La especie del animal es obligatoria")
    private AnimalSpecies species;

    @Size(max = 100, message = "La raza no debe exceder los 100 caracteres")
    private String breed;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate birthDate;
}

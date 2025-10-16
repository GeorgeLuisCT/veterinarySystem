package com.gaedet.biocampovet.core.employees.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseEmployeeRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String firstName;

    @NotBlank(message = "El apellido no puede estar vacío")
    private String lastName;

    @Email(message = "Debe ingresar un correo válido")
    @NotBlank(message = "El correo es obligatorio")
    private String email;

    @Size(max = 15, message = "El número de teléfono no debe exceder los 15 caracteres")
    private String phoneNumber;

    @NotBlank(message = "El cargo es obligatorio")
    private String burden;
}

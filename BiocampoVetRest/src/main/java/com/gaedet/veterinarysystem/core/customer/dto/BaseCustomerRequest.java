package com.gaedet.veterinarysystem.core.customer.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseCustomerRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no debe exceder los 100 caracteres")
    private String name;

    @NotNull(message = "El tipo de documento es obligatorio")
    private Long documentTypeId;

    @NotBlank(message = "El número de documento no puede estar vacío")
    @Size(max = 50, message = "El número de documento no debe exceder los 50 caracteres")
    private String documentNumber;

    @Size(max = 50, message = "El número de teléfono no debe exceder los 50 caracteres")
    private String phoneNumber;

    @Email(message = "El correo electrónico debe ser válido")
    @Size(max = 100, message = "El correo electrónico no debe exceder los 100 caracteres")
    private String email;

    @Size(max = 200, message = "La dirección no debe exceder los 200 caracteres")
    private String address;
}

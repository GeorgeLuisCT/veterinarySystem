package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.SupplierType;
import com.gaedet.biocampovet.core.inventory.util.ValidProductRequest;
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
public class BaseSupplierRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no debe superar los 100 caracteres")
    private String name;

    @NotBlank(message = "El RUC es obligatorio")
    @Size(max = 20, message = "El RUC no debe superar los 20 caracteres")
    private String ruc;

    @Size(max = 250, message = "La dirección no debe superar los 150 caracteres")
    private String address;

    @Size(max = 250, message = "El sitio web no debe superar los 100 caracteres")
    private String website;

    @Size(max = 250, message = "El teléfono de contacto no debe superar los 20 caracteres")
    private String contactPhone;

    @Email(message = "Debe ingresar un correo válido")
    @Size(max = 250, message = "El correo no debe superar los 100 caracteres")
    private String email;

    @NotNull(message = "El tipo de proveedor es obligatorio")
    private SupplierType supplierType;

    @Size(max = 30, message = "El número de cuenta no debe superar los 30 caracteres")
    private String bankAccountNumber;

    @Size(max = 150, message = "El nombre del banco no debe superar los 50 caracteres")
    private String bankName;
}
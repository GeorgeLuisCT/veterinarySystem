package com.gaedet.biocampovet.core.inventory.dto;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Getter
@Setter
public class CategoryProductRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 50, message = "El nombre no debe superar los 50 caracteres")
    @Pattern(regexp = "^[^§¶¤¬]+$", message = "El nombre no puede contener caracteres especiales como '§', '¶', '¤', '¬'")
    private String name;
}
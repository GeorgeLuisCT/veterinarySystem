package com.gaedet.veterinarysystem.core.inventory.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryProductResponse {
    private Long id;
    private String name;
    private boolean isActive;
}

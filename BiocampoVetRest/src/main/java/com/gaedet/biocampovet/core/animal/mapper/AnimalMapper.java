package com.gaedet.biocampovet.core.animal.mapper;

import com.gaedet.biocampovet.core.animal.dto.*;
import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.mapper.CustomerMapper;
import org.springframework.stereotype.Component;

@Component
public class AnimalMapper {

    private final CustomerMapper customerMapper;

    public AnimalMapper(CustomerMapper customerMapper) {
        this.customerMapper = customerMapper;
    }

    public Animal toEntity(AnimalCreateRequest request, Customer owner) {
        return Animal.builder()
                .name(request.getName())
                .owner(owner)
                .species(request.getSpecies())
                .breed(request.getBreed())
                .birthDate(request.getBirthDate())
                .isActive(true)
                .build();
    }

    public AnimalResponse toResponse(Animal entity) {
        if (entity == null) {
            return null;
        }

        return AnimalResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .photoUrl(entity.getPhotoUrl())
                .owner(customerMapper.toResponse(entity.getOwner()))
                .species(entity.getSpecies())
                .breed(entity.getBreed())
                .birthDate(entity.getBirthDate())
                .sex(entity.getSex())
                .microchipNumber(entity.getMicrochipNumber())
                .allergies(entity.getAllergies())
                .chronicConditions(entity.getChronicConditions())
                .isActive(entity.isActive())
                .build();
    }

    public static AnimalBasicResponse toBasicResponse(Animal animal) {
        AnimalBasicResponse animalBasicResponse = new AnimalBasicResponse();
        animalBasicResponse.setAnimalId(animal.getId());
        animalBasicResponse.setAnimalName(animal.getName());
        animalBasicResponse.setAnimalPhotoUrl(animal.getPhotoUrl());
        animalBasicResponse.setAnimalSpecies(animal.getSpecies());
        animalBasicResponse.setAnimalBreed(animal.getBreed());
        animalBasicResponse.setSex(animal.getSex());
        animalBasicResponse.setMicrochipNumber(animal.getMicrochipNumber());
        return animalBasicResponse;
    }

    public AnimalSummaryResponse toAnimalSummaryResponse(Animal entity) {
        return new AnimalSummaryResponse(
                entity.getId(),
                entity.getName(),
                entity.getBirthDate(),
                entity.getBreed(),
                entity.getSpecies(),
                entity.getOwner().getName(),
                entity.isActive()
        );
    }

    public void updateEntity(Animal entity, AnimalUpdateRequest request, Customer owner) {
        entity.setName(request.getName());
        entity.setOwner(owner);
        entity.setSpecies(request.getSpecies());
        entity.setBreed(request.getBreed());
        entity.setBirthDate(request.getBirthDate());
    }
}

package com.gaedet.biocampovet.core.animal.mapper;

import com.gaedet.biocampovet.core.animal.dto.*;
import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.entity.AnimalSpecies;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.mapper.CustomerMapper;
import org.springframework.stereotype.Component;

@Component
public class AnimalMapper {

    private final CustomerMapper customerMapper;
    private final AnimalSpeciesMapper animalSpeciesMapper;

    public AnimalMapper(CustomerMapper customerMapper, AnimalSpeciesMapper animalSpeciesMapper) {
        this.customerMapper = customerMapper;
        this.animalSpeciesMapper = animalSpeciesMapper;
    }

    public Animal toEntity(AnimalCreateRequest request, Customer owner, AnimalSpecies species) {
        return Animal.builder()
                .name(request.getName())
                .owner(owner)
                .species(species)
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
                .species(animalSpeciesMapper.toResponse(entity.getSpecies()))
                .breed(entity.getBreed())
                .birthDate(entity.getBirthDate())
                .sex(entity.getSex())
                .microchipNumber(entity.getMicrochipNumber())
                .allergies(entity.getAllergies())
                .chronicConditions(entity.getChronicConditions())
                .isActive(entity.isActive())
                .build();
    }

    public AnimalSummaryResponse toAnimalSummaryResponse(Animal entity) {
        return new AnimalSummaryResponse(
                entity.getId(),
                entity.getName(),
                entity.getBirthDate(),
                entity.getBreed(),
                entity.getSpecies().getName(),
                entity.getOwner().getName(),
                entity.isActive()
        );
    }

    public void updateEntity(Animal entity, AnimalUpdateRequest request, Customer owner, AnimalSpecies species) {
        entity.setName(request.getName());
        entity.setOwner(owner);
        entity.setSpecies(species);
        entity.setBreed(request.getBreed());
        entity.setBirthDate(request.getBirthDate());
    }
}

package com.gaedet.biocampovet.core.animal.service;

import com.gaedet.biocampovet.core.animal.dto.*;
import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.animal.mapper.AnimalMapper;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.animal.util.ClinicalHistoryUtils;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.repository.CustomerRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.sales.dto.*;
import com.gaedet.biocampovet.core.sales.repository.SaleProductRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final CustomerRepository customerRepository;
    private final AnimalMapper animalMapper;
    private final EntityManager entityManager;
    private final SaleProductRepository saleProductRepository;


    @Transactional
    public AnimalSummaryResponse createAnimal(AnimalCreateRequest request) {
        Customer owner = entityManager.getReference(Customer.class, request.getOwnerId());

        Animal animal = animalMapper.toEntity(request, owner);
        animalRepository.save(animal);

        return animalMapper.toAnimalSummaryResponse(animal);
    }

    public AnimalResponse getAnimal(Long id) {
        Animal animal = animalRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Animal no encontrado"));
        return animalMapper.toResponse(animal);
    }

    public PaginatedResponse<AnimalSummaryResponse> getAnimals(int page, int size, Boolean isActive, String query) {
        Pageable pageable = PageRequest.of(page, size);
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();

        Page<Object[]> rawPage = animalRepository.findAnimalSummary(searchQuery, isActive, pageable);
        Page<AnimalSummaryResponse> animalPage = rawPage.map(AnimalSummaryResponse::fromNativeRow);

        return PaginatedResponse.<AnimalSummaryResponse>builder()
                .content(animalPage.getContent())
                .totalPages(animalPage.getTotalPages())
                .totalElements(animalPage.getTotalElements())
                .currentPage(animalPage.getNumber())
                .pageSize(animalPage.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AnimalQuickSearchResponse> quickSearch(String query, boolean isActive) {
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();
        List<Object[]> rawResults = animalRepository.quickAnimalSearch(searchQuery, isActive);
        return rawResults.stream()
                .map(AnimalQuickSearchResponse::fromNativeRow)
                .toList();
    }
    @Transactional
    public AnimalSummaryResponse updateAnimal(AnimalUpdateRequest request) {
        Animal animal = animalRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Animal no encontrado"));

        Customer owner = customerRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Dueño no encontrado"));


        animalMapper.updateEntity(animal, request, owner);

        animalRepository.save(animal);

        return animalMapper.toAnimalSummaryResponse(animal);
    }

    @Transactional
    public void softDeleteAnimal(Long animalId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Animal no encontrado"));

        animal.setActive(false);

        animalRepository.save(animal);
    }

    @Transactional
    public void hardDeleteAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new RuntimeException("Animal no encontrado");
        }
        animalRepository.deleteById(animalId);
    }

    @Transactional
    public AnimalSummaryResponse restoreAnimal(Long animalId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Animal no encontrado"));

        animal.setActive(true);

        animalRepository.save(animal);

        return animalMapper.toAnimalSummaryResponse(animal);
    }

    @Transactional(readOnly = true)
    public ClinicalHistoryResponse getAnimalClinicalHistoryGrouped(Long animalId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new EntityNotFoundException("Animal not found"));

        List<SaleProductSummaryResponse> saleProducts = saleProductRepository.findSummaryByAnimalId(animalId);


        return ClinicalHistoryResponse.builder()
                .animal(animalMapper.toResponse(animal))
                .saleProductsGrouped(SaleProductsGrouped.builder()
                        .categories(ClinicalHistoryUtils.groupSaleProductsByCategory(saleProducts))
                        .build())
                .build();
    }

}


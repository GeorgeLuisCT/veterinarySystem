package com.gaedet.biocampovet.core.clinic.service;


import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.clinic.dto.MedicalRecordSummaryResponse;
import com.gaedet.biocampovet.core.clinic.repository.MedicalRecordEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordEntryRepository repository;
    private final AnimalRepository animalRepository;

    public List<MedicalRecordSummaryResponse> getLast20ByAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new EntityNotFoundException("El animal con id " + animalId + " no existe");
        }
        Pageable top20 = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "occurredAt"));
        return repository.findSummaryByAnimal(animalId, top20);
    }
}
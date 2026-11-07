package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateHospitalizationRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateHospitalizationRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import com.gaedet.veterinarysystem.core.clinic.entity.Hospitalization;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import com.gaedet.veterinarysystem.core.clinic.repository.*;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import com.gaedet.veterinarysystem.core.inventory.service.InventoryConsumptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HospitalizationLifecycleTest {

    @Mock HospitalizationRepository hospitalizationRepository;
    @Mock AnimalRepository animalRepository;
    @Mock CageRepository cageRepository;
    @Mock EmployeeRepository employeeRepository;
    @Mock EvolutionNoteRepository evolutionNoteRepository;
    @Mock TreatmentScheduleRepository treatmentScheduleRepository;
    @Mock AttentionRepository attentionsRepository;
    @Mock ClinicalServiceRepository clinicalServiceRepository;
    @Mock InventoryConsumptionService inventoryConsumptionService;
    @Mock ProductRepository productRepository;
    @Mock HospitalizationVitalSignRepository hospitalizationVitalSignRepository;

    @InjectMocks HospitalizationService service;

    private Cage cage;
    private Animal animal;

    @BeforeEach
    void setUp() {
        cage = new Cage();
        cage.setId(3L);
        cage.setOccupied(true);
        animal = new Animal();
        animal.setId(9L);
    }

    private Hospitalization hospitalization(HospitalizationStatus status) {
        return Hospitalization.builder().id(1L).animal(animal).cage(cage).status(status)
                .admissionDate(LocalDateTime.now().minusDays(2)).version(0).build();
    }

    @Test
    void dischargeFreesTheCageAndStampsTheDate() {
        Hospitalization h = hospitalization(HospitalizationStatus.STABLE);
        when(hospitalizationRepository.findById(1L)).thenReturn(Optional.of(h));
        when(hospitalizationRepository.save(any(Hospitalization.class))).thenAnswer(i -> i.getArgument(0));
        UpdateHospitalizationRequest request = new UpdateHospitalizationRequest();
        request.setVersion(0);
        request.setStatus(HospitalizationStatus.DISCHARGED);

        service.patchHospitalization(1L, request);

        assertFalse(cage.isOccupied(), "al dar el alta la jaula debe quedar libre");
        assertNotNull(h.getDischargeDate());
        verify(cageRepository).save(cage);
    }

    @Test
    void settingADischargeDateAloneAlsoDischarges() {
        Hospitalization h = hospitalization(HospitalizationStatus.OBSERVATION);
        when(hospitalizationRepository.findById(1L)).thenReturn(Optional.of(h));
        when(hospitalizationRepository.save(any(Hospitalization.class))).thenAnswer(i -> i.getArgument(0));
        UpdateHospitalizationRequest request = new UpdateHospitalizationRequest();
        request.setVersion(0);
        request.setDischargeDate(LocalDateTime.now());

        service.patchHospitalization(1L, request);

        assertEquals(HospitalizationStatus.DISCHARGED, h.getStatus());
        assertFalse(cage.isOccupied());
    }

    @Test
    void dischargedHospitalizationIsReadOnly() {
        Hospitalization h = hospitalization(HospitalizationStatus.DISCHARGED);
        when(hospitalizationRepository.findById(1L)).thenReturn(Optional.of(h));
        UpdateHospitalizationRequest request = new UpdateHospitalizationRequest();
        request.setVersion(0);
        request.setStatus(HospitalizationStatus.CRITICAL);

        assertThrows(IllegalStateException.class, () -> service.patchHospitalization(1L, request));
    }

    @Test
    void animalAlreadyHospitalizedCannotBeAdmittedAgain() {
        cage.setOccupied(false);
        when(animalRepository.findById(9L)).thenReturn(Optional.of(animal));
        when(cageRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(cage));
        when(hospitalizationRepository.existsByAnimalIdAndStatusNotIn(any(), anyCollection())).thenReturn(true);
        CreateHospitalizationRequest request = new CreateHospitalizationRequest();
        request.setAnimalId(9L);
        request.setCageId(3L);

        assertThrows(IllegalStateException.class, () -> service.createHospitalization(request));
        verify(hospitalizationRepository, never()).save(any());
    }

    @Test
    void occupiedCageRejectsAdmission() {
        when(animalRepository.findById(9L)).thenReturn(Optional.of(animal));
        when(cageRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(cage));
        CreateHospitalizationRequest request = new CreateHospitalizationRequest();
        request.setAnimalId(9L);
        request.setCageId(3L);

        assertThrows(IllegalStateException.class, () -> service.createHospitalization(request));
    }
}

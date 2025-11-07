package com.gaedet.biocampovet.core.publicportal.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.dto.PublicCompanyResponse;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.entity.Company;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.branches.repository.CompanyRepository;
import com.gaedet.biocampovet.core.branches.service.BranchService;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse;
import com.gaedet.biocampovet.core.clinic.entity.Appointment;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentStatus;
import com.gaedet.biocampovet.core.clinic.repository.AppointmentRepository;
import com.gaedet.biocampovet.core.clinic.service.ClinicalHistoryQueryService;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.entity.DocumentType;
import com.gaedet.biocampovet.core.customer.repository.CustomerRepository;
import com.gaedet.biocampovet.core.customer.repository.DocumentTypeRepository;
import com.gaedet.biocampovet.core.publicportal.dto.PublicAnimalSummaryResponse;
import com.gaedet.biocampovet.core.publicportal.dto.PublicAppointmentRequest;
import com.gaedet.biocampovet.core.publicportal.dto.PublicAppointmentResponse;
import com.gaedet.biocampovet.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PublicPortalService {

    private final CustomerRepository customerRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final AnimalRepository animalRepository;
    private final BranchRepository branchRepository;
    private final BranchService branchService;
    private final AppointmentRepository appointmentRepository;
    private final ClinicalHistoryQueryService clinicalHistoryQueryService;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public PublicCompanyResponse getCompanyInfo() {
        Company company = companyRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Información de la compañía no encontrada."));

        return toPublicCompanyResponse(company);
    }

    @Transactional(readOnly = true)
    public List<PublicAnimalSummaryResponse> getAnimalsForClient(Long documentTypeId, String documentNumber) {
        Customer customer = resolveCustomer(documentTypeId, documentNumber);
        List<Animal> animals = animalRepository.findByOwner_IdAndIsActiveTrueOrderByNameAsc(customer.getId());
        return animals.stream()
                .map(this::toPublicAnimalSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicalHistoryDetailResponse getClinicalHistory(Long documentTypeId, String documentNumber, Long animalId) {
        Customer customer = resolveCustomer(documentTypeId, documentNumber);
        Animal animal = getAnimalOrThrow(animalId);
        ensureAnimalBelongsToCustomer(animal, customer);
        return clinicalHistoryQueryService.getAnimalHistory(animalId, null, null);
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> getPublicBranches() {
        return branchService.getAllBranches(null);
    }

    @Transactional
    public PublicAppointmentResponse createAppointmentRequest(PublicAppointmentRequest request) {
        Customer customer = resolveCustomer(request.getDocumentTypeId(), request.getDocumentNumber());
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        ensureAnimalBelongsToCustomer(animal, customer);
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new BadRequestException("La sede seleccionada no existe."));

        String requesterName = requireValue(trimOrNull(request.getRequesterName()), "Indica el nombre de contacto para la cita.");
        Appointment appointment = Appointment.builder()
                .animal(animal)
                .branch(branch)
                .startDateTime(normalizeDateTime(request.getPreferredDateTime()))
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .type(request.getType())
                .status(AppointmentStatus.REQUESTED)
                .requesterName(requesterName)
                .requesterEmail(trimOrNull(request.getRequesterEmail()))
                .requesterPhone(trimOrNull(request.getRequesterPhone()))
                .requestNotes(trimOrNull(request.getNotes()))
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        return PublicAppointmentResponse.builder()
                .appointmentId(saved.getId())
                .status(saved.getStatus())
                .type(saved.getType())
                .requestedStart(saved.getStartDateTime())
                .branchName(branch.getName())
                .animalName(animal.getName())
                .build();
    }

    private Customer resolveCustomer(Long documentTypeId, String documentNumber) {
        String normalizedDocument = trimOrNull(documentNumber);
        if (normalizedDocument == null) {
            throw new BadRequestException("Debes ingresar un número de documento.");
        }

        DocumentType documentType = documentTypeRepository.findById(documentTypeId)
                .orElseThrow(() -> new BadRequestException("El tipo de documento seleccionado no es válido."));

        Customer customer = customerRepository.findByDocumentNumber(normalizedDocument)
                .orElseThrow(() -> new BadRequestException("No encontramos un cliente con los datos proporcionados."));

        if (!customer.isActive()) {
            throw new BadRequestException("El cliente se encuentra inactivo. Comunícate con la clínica.");
        }

        if (customer.getDocumentType() == null || !customer.getDocumentType().getId().equals(documentType.getId())) {
            throw new BadRequestException("El tipo de documento no coincide con el registrado para el cliente.");
        }

        return customer;
    }

    private Animal getAnimalOrThrow(Long animalId) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new BadRequestException("La mascota indicada no existe."));

        if (!animal.isActive()) {
            throw new BadRequestException("La mascota está inactiva. Comunícate con la clínica para más información.");
        }
        return animal;
    }

    private void ensureAnimalBelongsToCustomer(Animal animal, Customer customer) {
        if (animal.getOwner() == null || !animal.getOwner().getId().equals(customer.getId())) {
            throw new BadRequestException("La mascota no pertenece al cliente autenticado.");
        }
    }

    private PublicAnimalSummaryResponse toPublicAnimalSummary(Animal animal) {
        String speciesLabel = animal.getSpecies() != null
                ? capitalize(animal.getSpecies().name().replace('_', ' '))
                : null;
        return PublicAnimalSummaryResponse.builder()
                .id(animal.getId())
                .name(animal.getName())
                .photoUrl(animal.getPhotoUrl())
                .species(animal.getSpecies())
                .speciesLabel(speciesLabel)
                .breed(animal.getBreed())
                .sex(animal.getSex())
                .build();
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String lower = value.toLowerCase(Locale.getDefault());
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LocalDateTime normalizeDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            throw new BadRequestException("Selecciona la fecha y hora deseadas para la cita.");
        }
        if (dateTime.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new BadRequestException("La fecha de cita debe ser actual o posterior.");
        }
        return dateTime;
    }

    private String requireValue(String value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }
    private PublicCompanyResponse toPublicCompanyResponse(Company company) {
        return PublicCompanyResponse.builder()
                .name(company.getName())
                .industry(company.getIndustry())
                .build();
    }
}

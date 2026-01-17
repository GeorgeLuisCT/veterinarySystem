package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.entity.Company;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.branches.repository.CompanyRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.history.ClinicalHistoryAnimalSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.history.ClinicalHistoryDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.clinic.repository.AttentionRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalAttentionRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.customer.entity.Customer;
import com.gaedet.veterinarysystem.core.customer.entity.DocumentType;
import com.gaedet.veterinarysystem.core.customer.repository.CustomerRepository;
import com.gaedet.veterinarysystem.core.customer.repository.DocumentTypeRepository;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.global.enums.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ClinicalHistoryQueryServiceTest {

    @Autowired
    private ClinicalHistoryQueryService clinicalHistoryQueryService;
    @Autowired
    private DocumentTypeRepository documentTypeRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private AnimalRepository animalRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private ClinicalServiceRepository clinicalServiceRepository;
    @Autowired
    private AttentionRepository attentionRepository;
    @Autowired
    private ClinicalAttentionRepository clinicalAttentionRepository;

    private Long animalId;

    @BeforeEach
    void setUp() {
        DocumentType documentType = documentTypeRepository.save(DocumentType.builder()
                .name("Documento Nacional de Identidad")
                .abbreviation("DNI")
                .build());

        Customer owner = customerRepository.save(Customer.builder()
                .name("Juan Pérez")
                .email("juan@example.com")
                .phoneNumber("555-0101")
                .address("Av. Siempre Viva 123")
                .documentType(documentType)
                .documentNumber("12345678")
                .build());

        Animal animal = animalRepository.save(Animal.builder()
                .name("Firulais")
                .owner(owner)
                .species(AnimalSpecies.CANINE)
                .breed("Labrador")
                .birthDate(LocalDate.now().minusYears(3))
                .microchipNumber("MICRO-001")
                .isActive(true)
                .build());

        Company company = companyRepository.save(Company.builder()
                .name("System veterinary")
                .industry("Veterinaria")
                .build());

        Branch branch = branchRepository.save(Branch.builder()
                .name("Sede Central")
                .location("Ciudad")
                .company(company)
                .build());

        Employee veterinarian = employeeRepository.save(Employee.builder()
                .firstName("Ana")
                .lastName("González")
                .email("ana.gonzalez@example.com")
                .phoneNumber("555-0202")
                .burden("Veterinaria")
                .calendarColorHex("#00AA88")
                .build());

        ClinicalService consultationService = clinicalServiceRepository.save(ClinicalService.builder()
                .name("Consulta General")
                .clinicalServiceCategory(ClinicalServiceCategory.CONSULTATION)
                .description("Consulta médica general")
                .price(BigDecimal.valueOf(80))
                .build());

        ClinicalService vaccinationService = clinicalServiceRepository.save(ClinicalService.builder()
                .name("Vacuna Antirrábica")
                .clinicalServiceCategory(ClinicalServiceCategory.VACCINATION)
                .description("Refuerzo anual contra rabia")
                .price(BigDecimal.valueOf(50))
                .reminderPeriod(12)
                .reminderPeriodUnit(TimeUnit.MONTHS)
                .build());

        Attentions attention = attentionRepository.save(Attentions.builder()
                .branch(branch)
                .animal(animal)
                .attendingEmployee(veterinarian)
                .checkInTime(LocalDateTime.now().minusMinutes(40))
                .type(AttentionType.CLINIC)
                .status(AttentionsStatus.FINISHED)
                .service(consultationService)
                .isEmergency(false)
                .build());

        ClinicalAttention clinicalAttention = ClinicalAttention.builder()
                .attention(attention)
                .visitDate(LocalDateTime.now().minusMinutes(15))
                .status(ClinicalAttentionStatus.CLOSED)
                .subjective("Paciente con prurito en oreja derecha.")
                .objective("Conducto auditivo inflamado, presencia de cerumen.")
                .assessment("Otitis externa leve.")
                .plan("Limpiar oído y aplicar gotas antibióticas.")
                .weightKg(12.4)
                .temperatureCelsius(38.6)
                .heartRate(98)
                .respiratoryRate(24)
                .build();

        ClinicalServiceItem vaccineItem = ClinicalServiceItem.builder()
                .clinicalAttention(clinicalAttention)
                .clinicalService(vaccinationService)
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(50))
                .subtotal(BigDecimal.valueOf(50))
                .notes("Aplicar refuerzo anual.")
                .build();

        clinicalAttention.getServiceItems().add(vaccineItem);
        clinicalAttentionRepository.save(clinicalAttention);

        this.animalId = animal.getId();
    }

    @Test
    void shouldReturnDetailedHistoryForAnimal() {
        ClinicalHistoryDetailResponse response = clinicalHistoryQueryService.getAnimalHistory(animalId, null, null);

        assertThat(response.getPatient()).isNotNull();
        assertThat(response.getPatient().getName()).isEqualTo("Firulais");
        assertThat(response.getConsultations()).hasSize(1);
        ClinicalHistoryDetailResponse.Consultation consultation = response.getConsultations().get(0);
        assertThat(consultation.getClinicalServiceName()).isEqualTo("Consulta General");
        assertThat(consultation.getDiagnosis()).contains("Otitis externa");
        assertThat(response.getPreventiveCare().getVaccines()).hasSize(1);
        assertThat(response.getWeightHistory()).hasSize(1);
    }

    @Test
    void shouldListAnimalsWithSummaryInformation() {
        PaginatedResponse<ClinicalHistoryAnimalSummaryResponse> page = clinicalHistoryQueryService.searchAnimals(
                "Firu",
                null,
                true,
                0,
                10
        );

        assertThat(page.getContent()).hasSize(1);
        ClinicalHistoryAnimalSummaryResponse summary = page.getContent().get(0);
        assertThat(summary.getAnimalId()).isEqualTo(animalId);
        assertThat(summary.getLastVisitDate()).isNotNull();
        assertThat(summary.getTotalConsultations()).isEqualTo(1);
        assertThat(summary.getTotalProcedures()).isEqualTo(0);
    }
}

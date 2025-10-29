package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.fieltd.dto.AddProductUsageRequest;
import com.gaedet.biocampovet.core.fieltd.dto.AddServiceItemRequest;
import com.gaedet.biocampovet.core.fieltd.dto.FieldVisitProductUsageResponse;
import com.gaedet.biocampovet.core.fieltd.dto.FieldVisitReportResponse;
import com.gaedet.biocampovet.core.fieltd.dto.FieldVisitServiceGroupInput;
import com.gaedet.biocampovet.core.fieltd.dto.UpdateFieldVisitReportRequest;
import com.gaedet.biocampovet.core.fieltd.dto.UpdateFieldVisitStatusRequest;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisit;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitProductUsage;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceItem;
import com.gaedet.biocampovet.core.fieltd.entity.Vehicle;
import com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus;
import com.gaedet.biocampovet.core.fieltd.repository.FieldVisitRepository;
import com.gaedet.biocampovet.core.fieltd.repository.VehicleRepository;
import com.gaedet.biocampovet.core.fieltd.entity.ProductVehicleStock;
import com.gaedet.biocampovet.core.fieltd.repository.ProductVehicleStockRepository;
import com.gaedet.biocampovet.core.fieltd.repository.FieldVisitProductUsageRepository;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.customer.entity.DocumentType;
import com.gaedet.biocampovet.core.customer.repository.CustomerRepository;
import com.gaedet.biocampovet.core.customer.repository.DocumentTypeRepository;
import com.gaedet.biocampovet.core.fieltd.dto.FieldVisitServiceProductInput;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.repository.CategoryProductRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openapitools.jackson.nullable.JsonNullable;
import org.springframework.beans.factory.annotation.Autowired;
import com.gaedet.biocampovet.security.service.InitializerService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FieldVisitServiceTest {

    @Autowired
    private FieldVisitService fieldVisitService;

    @Autowired
    private FieldVisitRepository fieldVisitRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ClinicalServiceRepository clinicalServiceRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DocumentTypeRepository documentTypeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryProductRepository categoryProductRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ProductVehicleStockRepository productVehicleStockRepository;

    @Autowired
    private FieldVisitProductUsageRepository productUsageRepository;

    private FieldVisit visit;
    private ClinicalService clinicalService;
    private List<Animal> availableAnimals;
    private Product product;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        Employee vet = employeeRepository.save(
                Employee.builder()
                        .firstName("Ana")
                        .lastName("Campos")
                        .email("ana.vet+" + UUID.randomUUID() + "@example.com")
                        .burden("Field Vet")
                        .isFieldVet(true)
                        .build()
        );

        visit = fieldVisitRepository.saveAndFlush(
                FieldVisit.builder()
                        .fieldVet(vet)
                        .scheduledDateTime(LocalDateTime.now())
                        .status(FieldVisitStatus.IN_PROGRESS)
                        .objective("Revisión sanitaria general")
                        .build()
        );

        clinicalService = clinicalServiceRepository.saveAndFlush(
                ClinicalService.builder()
                        .name("Servicio de prueba " + UUID.randomUUID())
                        .clinicalServiceCategory(ClinicalServiceCategory.VACCINATION)
                        .price(BigDecimal.valueOf(35))
                        .build()
        );

        product = productRepository.findAll().stream().findFirst().orElseGet(() -> {
            CategoryProduct category = categoryProductRepository.findAll().stream().findFirst()
                    .orElseGet(() -> categoryProductRepository.save(CategoryProduct.builder()
                            .name("Categoria Test")
                            .isActive(true)
                            .build()));
            Product created = Product.builder()
                    .name("Producto Test " + UUID.randomUUID())
                    .description("Producto de prueba")
                    .minStock(1)
                    .category(category)
                    .sku("SKU-" + UUID.randomUUID())
                    .presentation(ProductPresentationType.NONE)
                    .unitType(ProductUnitType.UNIT)
                    .contentTotal(1.0)
                    .build();
            return productRepository.save(created);
        });

        vehicle = vehicleRepository.save(
                Vehicle.builder()
                        .name("Vehiculo Test " + UUID.randomUUID())
                        .active(true)
                        .build()
        );
        visit.setVehicle(vehicle);
        visit = fieldVisitRepository.saveAndFlush(visit);

        productVehicleStockRepository.save(ProductVehicleStock.builder()
                .vehicle(vehicle)
                .product(product)
                .unit(ProductUnitType.UNIT)
                .quantity(100)
                .build());

        availableAnimals = new ArrayList<>(animalRepository.findAll());
        if (availableAnimals.size() < 2) {
            DocumentType documentType = documentTypeRepository.findAll().stream()
                    .findFirst()
                    .orElseGet(() -> documentTypeRepository.save(
                            DocumentType.builder()
                                    .name("DNI Test")
                                    .abbreviation("DNI")
                                    .build()
                    ));

            Customer customer = customerRepository.save(
                    Customer.builder()
                            .name("Cliente Prueba")
                            .documentType(documentType)
                            .documentNumber("DOC-" + UUID.randomUUID())
                            .email("cliente+" + UUID.randomUUID() + "@example.com")
                            .phoneNumber("999000111")
                            .address("Dirección de prueba")
                            .isActive(true)
                            .build()
            );

            Animal first = animalRepository.save(
                    Animal.builder()
                            .owner(customer)
                            .name("Animal Test 1")
                            .species(AnimalSpecies.BOVINE)
                            .breed("Mixta")
                            .birthDate(java.time.LocalDate.now().minusYears(2))
                            .sex(AnimalSex.FEMALE)
                            .isActive(true)
                            .build()
            );

            Animal second = animalRepository.save(
                    Animal.builder()
                            .owner(customer)
                            .name("Animal Test 2")
                            .species(AnimalSpecies.OVINE)
                            .breed("Criolla")
                            .birthDate(java.time.LocalDate.now().minusYears(1))
                            .sex(AnimalSex.MALE)
                            .isActive(true)
                            .build()
            );

            availableAnimals.clear();
            availableAnimals.add(first);
            availableAnimals.add(second);
        }
    }

    @Test
    void addServiceItemShouldPersistAnimalsAndGroups() {
        AddServiceItemRequest request = AddServiceItemRequest.builder()
                .clinicalServiceId(clinicalService.getId())
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(70))
                .animalIds(List.of(availableAnimals.get(0).getId(), availableAnimals.get(1).getId()))
                .groups(List.of(
                        FieldVisitServiceGroupInput.builder()
                                .species(AnimalSpecies.OVINE)
                                .quantity(200)
                                .description("Lote de ovejas en potrero A")
                                .build()
                ))
                .products(List.of(
                        FieldVisitServiceProductInput.builder()
                                .productId(product.getId())
                                .dose(BigDecimal.ONE)
                                .unit(ProductUnitType.UNIT)
                                .administrationRoute(AdministrationRoute.ORAL)
                                .build()
                ))
                .notes("Aplicación programada")
                .build();

        var response = fieldVisitService.addServiceItem(visit.getId(), request);

        assertThat(response.getAnimals()).hasSize(2);
        assertThat(response.getGroups()).hasSize(1);
        assertThat(response.getProducts()).hasSize(1);

        FieldVisit persisted = fieldVisitRepository.findById(visit.getId()).orElseThrow();
        FieldVisitServiceItem item = persisted.getServiceItems().iterator().next();

        assertThat(item.getAnimals()).hasSize(2);
        assertThat(item.getGroups()).hasSize(1);
        assertThat(item.getProducts()).hasSize(1);
        assertThat(item.getNotes()).isEqualTo("Aplicación programada");
    }

    @Test
    void updateReportShouldCreateAndUpdateFields() {
        FieldVisitReportResponse initial = fieldVisitService.getById(visit.getId()).getReport();
        assertThat(initial).isNotNull();

        UpdateFieldVisitReportRequest payload = new UpdateFieldVisitReportRequest();
        payload.setVersion(initial.getVersion());
        payload.setFindings(JsonNullable.of("Ganado con condición corporal adecuada."));

        FieldVisitReportResponse updated = fieldVisitService.updateReport(visit.getId(), payload);

        assertThat(updated.getFindings()).isEqualTo("Ganado con condición corporal adecuada.");
        assertThat(updated.getVersion()).isGreaterThan(initial.getVersion());

        UpdateFieldVisitReportRequest secondPayload = new UpdateFieldVisitReportRequest();
        secondPayload.setVersion(updated.getVersion());
        secondPayload.setDiagnoses(JsonNullable.of("Sin hallazgos patológicos."));
        FieldVisitReportResponse second = fieldVisitService.updateReport(visit.getId(), secondPayload);

        assertThat(second.getDiagnoses()).isEqualTo("Sin hallazgos patológicos.");
        assertThat(second.getFindings()).isEqualTo("Ganado con condición corporal adecuada.");
    }

    @Test
    void updateStatusShouldPersistNewStatus() {
        UpdateFieldVisitStatusRequest request = new UpdateFieldVisitStatusRequest();
        request.setStatus(FieldVisitStatus.COMPLETED);

        var updated = fieldVisitService.updateStatus(visit.getId(), request);

        assertThat(updated.getStatus()).isEqualTo(FieldVisitStatus.COMPLETED);
        FieldVisit persisted = fieldVisitRepository.findById(visit.getId()).orElseThrow();
        assertThat(persisted.getStatus()).isEqualTo(FieldVisitStatus.COMPLETED);
    }

    @Test
    void addProductUsageShouldStorePriceInformation() {
        AddProductUsageRequest request = AddProductUsageRequest.builder()
                .productId(product.getId())
                .unit(ProductUnitType.UNIT)
                .quantityUsed(3)
                .unitPrice(BigDecimal.valueOf(12.5))
                .notes("Venta directa")
                .build();

        FieldVisitProductUsageResponse response = fieldVisitService.addProductUsage(visit.getId(), request, null);

        assertThat(response.getUnitPrice()).isEqualByComparingTo("12.5");
        assertThat(response.getSubtotal()).isEqualByComparingTo("37.5");

        FieldVisitProductUsage usage = productUsageRepository.findAll().stream().findFirst().orElseThrow();
        assertThat(usage.getFieldVisit().getId()).isEqualTo(visit.getId());
        assertThat(usage.getUnitPrice()).isEqualByComparingTo("12.5");
        assertThat(usage.getSubtotal()).isEqualByComparingTo("37.5");
        assertThat(usage.getNotes()).isEqualTo("Venta directa");
    }
}

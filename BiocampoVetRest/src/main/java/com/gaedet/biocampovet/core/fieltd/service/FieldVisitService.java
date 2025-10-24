package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.entity.*;
import com.gaedet.biocampovet.core.fieltd.enums.StockLocationType;
import com.gaedet.biocampovet.core.fieltd.enums.StockMovementType;
import com.gaedet.biocampovet.core.fieltd.mapper.FieldVisitMapper;
import com.gaedet.biocampovet.core.fieltd.repository.*;
import com.gaedet.biocampovet.core.fieltd.specs.FieldVisitSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldVisitService {

    private final FieldVisitRepository fieldVisitRepository;
    private final FieldVisitServiceItemRepository serviceItemRepository;
    private final FieldVisitProductUsageRepository productUsageRepository;
    private final FieldVisitAttachmentRepository attachmentRepository;
    private final FieldVisitBiosecurityRepository bioRepository;
    private final FieldVisitReportRepository fieldVisitReportRepository;
    private final EmployeeRepository employeeRepository;
    private final VehicleRepository vehicleRepository;
    private final AnimalRepository animalRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final ProductRepository productRepository;
    private final ProductVehicleStockRepository productVehicleStockRepository;
    private final ProductStockMovementRepository productStockMovementRepository;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public PaginatedResponse<FieldVisitSummaryResponse> list(int page, int size, String q, com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus status,
                                                            Long vetId, Long farmId, Long zoneId, Long vehicleId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        Specification<FieldVisit> spec = FieldVisitSpecs.byFilters(q, status, vetId, farmId, zoneId, vehicleId, from, to);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("scheduledDateTime").descending());
        Page<FieldVisit> result = fieldVisitRepository.findAll(spec, pageable);
        List<FieldVisitSummaryResponse> summaries = result.getContent().stream().map(FieldVisitMapper::toSummary).collect(Collectors.toList());
        return PaginatedResponse.<FieldVisitSummaryResponse>builder()
                .content(summaries)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional
    public FieldVisitResponse getById(Long id) {
        FieldVisit e = fieldVisitRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("FieldVisit no encontrado: id=" + id));
        ensureReport(e);
        return FieldVisitMapper.toResponse(e);
    }

    @Transactional
    public FieldVisitResponse create(CreateFieldVisitRequest r) {
        FieldVisit e = new FieldVisit();
        if (r.getFarmId() == null && r.getZoneId() == null) {
            throw new IllegalArgumentException("Debe seleccionar una finca o una zona para planificar la visita.");
        }
        e.setFarm(r.getFarmId() != null ? em.getReference(Farm.class, r.getFarmId()) : null);
        e.setZone(r.getZoneId() != null ? em.getReference(GeoZone.class, r.getZoneId()) : null);
        e.setFieldVet(em.getReference(Employee.class, r.getFieldVetId()));
        if (r.getVehicleId() != null) e.setVehicle(em.getReference(Vehicle.class, r.getVehicleId()));
        e.setScheduledDateTime(r.getScheduledDateTime());
        e.setObjective(r.getObjective());
        e.setStatus(com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus.PLANNED);
        syncCompanions(e, r.getCompanionIds());
        FieldVisit saved = fieldVisitRepository.save(e);
        return FieldVisitMapper.toResponse(saved);
    }

    @Transactional
    public FieldVisitResponse update(Long id, UpdateFieldVisitRequest r) {
        FieldVisit e = fieldVisitRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("FieldVisit no encontrado: id=" + id));
        if (r.getFarmId() == null && r.getZoneId() == null) {
            throw new IllegalArgumentException("Debe seleccionar una finca o una zona para planificar la visita.");
        }
        e.setFarm(r.getFarmId() != null ? em.getReference(Farm.class, r.getFarmId()) : null);
        e.setZone(r.getZoneId() != null ? em.getReference(GeoZone.class, r.getZoneId()) : null);
        e.setFieldVet(em.getReference(Employee.class, r.getFieldVetId()));
        e.setVehicle(r.getVehicleId() != null ? em.getReference(Vehicle.class, r.getVehicleId()) : null);
        e.setScheduledDateTime(r.getScheduledDateTime());
        e.setObjective(r.getObjective());
        e.setStatus(r.getStatus());
        e.setRouteOrder(r.getRouteOrder());
        syncCompanions(e, r.getCompanionIds());
        return FieldVisitMapper.toResponse(e);
    }

    @Transactional
    public FieldVisitSummaryResponse delete(Long id) {
        FieldVisit e = fieldVisitRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("FieldVisit no encontrado: id=" + id));
        FieldVisitSummaryResponse summary = FieldVisitMapper.toSummary(e);
        fieldVisitRepository.delete(e);
        return summary;
    }

    @Transactional
    public FieldVisitServiceItemResponse addServiceItem(Long visitId, AddServiceItemRequest r) {
        FieldVisit visit = fieldVisitRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("Visita no encontrada: id=" + visitId));
        ClinicalService cs = clinicalServiceRepository.findById(r.getClinicalServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + r.getClinicalServiceId()));
        FieldVisitServiceItem item = FieldVisitServiceItem.builder()
                .fieldVisit(visit)
                .clinicalService(cs)
                .quantity(r.getQuantity())
                .unitPrice(r.getUnitPrice())
                .performedBy(r.getPerformedById() != null
                        ? employeeRepository.findById(r.getPerformedById())
                        .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + r.getPerformedById()))
                        : null)
                .notes(normalize(r.getNotes()))
                .build();

        if (r.getAnimalIds() != null && !r.getAnimalIds().isEmpty()) {
            Set<FieldVisitServiceAnimal> animals = r.getAnimalIds().stream()
                    .map(animalId -> {
                        Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new IllegalArgumentException("Animal no encontrado: id=" + animalId));
                        return FieldVisitServiceAnimal.builder()
                                .serviceItem(item)
                                .animal(animal)
                                .build();
                    })
                    .collect(Collectors.toCollection(HashSet::new));
            item.setAnimals(animals);
        }

        if (r.getGroups() != null && !r.getGroups().isEmpty()) {
            Set<FieldVisitServiceGroup> groups = r.getGroups().stream()
                    .filter(group -> group != null && group.getQuantity() != null && group.getQuantity() > 0)
                    .map(group -> FieldVisitServiceGroup.builder()
                            .serviceItem(item)
                            .species(group.getSpecies())
                            .breed(normalize(group.getBreed()))
                            .quantity(group.getQuantity())
                            .description(normalize(group.getDescription()))
                            .build())
                    .collect(Collectors.toCollection(HashSet::new));
            item.setGroups(groups);
        }

        if (r.getProducts() != null && !r.getProducts().isEmpty()) {
            Set<FieldVisitServiceProduct> products = r.getProducts().stream()
                    .filter(productInput -> productInput != null && productInput.getProductId() != null)
                    .map(productInput -> {
                        Product product = productRepository.findById(productInput.getProductId())
                                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + productInput.getProductId()));
                        return FieldVisitServiceProduct.builder()
                                .serviceItem(item)
                                .product(product)
                                .dose(productInput.getDose())
                                .unit(productInput.getUnit())
                                .administrationRoute(productInput.getAdministrationRoute())
                                .build();
                    })
                    .collect(Collectors.toCollection(HashSet::new));
            item.setProducts(products);
        } else {
            item.setProducts(Collections.emptySet());
        }

        serviceItemRepository.save(item);
        visit.getServiceItems().add(item);
        return FieldVisitMapper.toServiceItem(item);
    }

    @Transactional
    public FieldVisitReportResponse updateReport(Long visitId, UpdateFieldVisitReportRequest request) {
        FieldVisit visit = fieldVisitRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("Visita no encontrada: id=" + visitId));
        FieldVisitReport report = ensureReport(visit);

        if (report.getVersion() != null && !report.getVersion().equals(request.getVersion())) {
            throw new IllegalStateException("El reporte fue actualizado por otro usuario. Recarga la página e inténtalo nuevamente.");
        }

        if (request.getFindings() != null && request.getFindings().isPresent()) {
            report.setFindings(normalize(request.getFindings().orElse(null)));
        }
        if (request.getDiagnoses() != null && request.getDiagnoses().isPresent()) {
            report.setDiagnoses(normalize(request.getDiagnoses().orElse(null)));
        }
        if (request.getRecommendations() != null && request.getRecommendations().isPresent()) {
            report.setRecommendations(normalize(request.getRecommendations().orElse(null)));
        }

        FieldVisitReport saved = fieldVisitReportRepository.saveAndFlush(report);
        visit.setReport(saved);
        return FieldVisitMapper.toReport(saved);
    }

    @Transactional
    public FieldVisitResponse updateStatus(Long visitId, UpdateFieldVisitStatusRequest request) {
        FieldVisit visit = fieldVisitRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("Visita no encontrada: id=" + visitId));
        visit.setStatus(request.getStatus());
        FieldVisit saved = fieldVisitRepository.save(visit);
        ensureReport(saved);
        return FieldVisitMapper.toResponse(saved);
    }

    @Transactional
    public FieldVisitProductUsageResponse addProductUsage(Long visitId, AddProductUsageRequest r, Long performedById) {
        FieldVisit visit = fieldVisitRepository.findById(visitId).orElseThrow(() -> new IllegalArgumentException("Visita no encontrada"));
        Product product = em.getReference(Product.class, r.getProductId());
        Vehicle vehicle = r.getVehicleId() != null ? em.getReference(Vehicle.class, r.getVehicleId()) : visit.getVehicle();
        if (vehicle == null) {
            throw new IllegalArgumentException("Se requiere un vehículo para el consumo de insumos.");
        }

        ProductVehicleStock pvs = productVehicleStockRepository.findByVehicle_IdAndProduct_Id(vehicle.getId(), product.getId())
                .orElseGet(() -> ProductVehicleStock.builder()
                        .vehicle(vehicle)
                        .product(product)
                        .unit(product.getUnitType())
                        .quantity(0)
                        .build());
        if (pvs.getUnit() == null) {
            pvs.setUnit(product.getUnitType());
        }
        if (r.getUnit() != null && pvs.getUnit() != r.getUnit()) {
            throw new IllegalArgumentException("La unidad solicitada no coincide con el inventario del vehículo.");
        }
        int newQty = (pvs.getQuantity() == null ? 0 : pvs.getQuantity()) - r.getQuantityUsed();
        if (newQty < 0) {
            throw new IllegalArgumentException("Stock insuficiente en el vehículo.");
        }
        pvs.setQuantity(newQty);
        productVehicleStockRepository.save(pvs);

        ProductStockMovement move = ProductStockMovement.builder()
                .movementType(StockMovementType.CONSUMPTION)
                .product(product)
                .quantityDelta(-Math.abs(r.getQuantityUsed()))
                .fromType(StockLocationType.VEHICLE)
                .toType(StockLocationType.FIELD)
                .vehicle(vehicle)
                .fieldVisit(visit)
                .createdBy(performedById != null ? em.getReference(Employee.class, performedById) : null)
                .unit(pvs.getUnit())
                .notes(r.getNotes())
                .build();
        productStockMovementRepository.save(move);

        BigDecimal unitPrice = r.getUnitPrice();
        BigDecimal subtotal = unitPrice != null
                ? unitPrice.multiply(BigDecimal.valueOf(r.getQuantityUsed()))
                : null;

        FieldVisitProductUsage usage = FieldVisitProductUsage.builder()
                .fieldVisit(visit)
                .product(product)
                .unit(pvs.getUnit())
                .quantityUsed(r.getQuantityUsed())
                .sourceVehicle(vehicle)
                .notes(normalize(r.getNotes()))
                .unitPrice(unitPrice)
                .subtotal(subtotal)
                .build();
        productUsageRepository.save(usage);
        return FieldVisitMapper.toProductUsage(usage);
    }

    @Transactional
    public FieldVisitAttachmentResponse addAttachment(Long visitId, AddAttachmentRequest r) {
        FieldVisit visit = em.getReference(FieldVisit.class, visitId);
        FieldVisitAttachment a = FieldVisitAttachment.builder()
                .fieldVisit(visit)
                .fileName(r.getFileName())
                .fileUrl(r.getFileUrl())
                .mimeType(r.getMimeType())
                .build();
        attachmentRepository.save(a);
        return FieldVisitMapper.toAttachment(a);
    }

    @Transactional
    public FieldVisitBiosecurityResponse setBiosecurity(Long visitId, SetBiosecurityRequest r) {
        FieldVisit visit = fieldVisitRepository.findById(visitId).orElseThrow(() -> new IllegalArgumentException("Visita no encontrada"));
        FieldVisitBiosecurity b = visit.getBiosecurity();
        if (b == null) {
            b = FieldVisitBiosecurity.builder().fieldVisit(visit).build();
            visit.setBiosecurity(b);
        }
        if (r.getVehicleAndEquipmentCleaned() != null) b.setVehicleAndEquipmentCleaned(r.getVehicleAndEquipmentCleaned());
        if (r.getPpeUsed() != null) b.setPpeUsed(r.getPpeUsed());
        if (r.getHandHygiene() != null) b.setHandHygiene(r.getHandHygiene());
        b.setNotes(r.getNotes());
        bioRepository.save(b);
        return FieldVisitMapper.toBiosecurity(b);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void syncCompanions(FieldVisit visit, List<Long> companionIds) {
        Set<Long> desired = companionIds == null ? Set.of() : companionIds.stream()
                .filter(id -> id != null && !id.equals(visit.getFieldVet().getId()))
                .collect(Collectors.toSet());

        visit.getCompanions().removeIf(companion -> {
            Long companionId = companion.getEmployee().getId();
            boolean keep = desired.contains(companionId);
            if (!keep) {
                companion.setFieldVisit(null);
            }
            return !keep;
        });

        Set<Long> existing = visit.getCompanions().stream()
                .map(c -> c.getEmployee().getId())
                .collect(Collectors.toCollection(HashSet::new));

        for (Long id : desired) {
            if (!existing.contains(id)) {
                FieldVisitCompanion companion = FieldVisitCompanion.builder()
                        .fieldVisit(visit)
                        .employee(em.getReference(Employee.class, id))
                        .build();
                visit.getCompanions().add(companion);
            }
        }
    }

    private FieldVisitReport ensureReport(FieldVisit visit) {
        FieldVisitReport report = visit.getReport();
        if (report != null) {
            return report;
        }

        return fieldVisitReportRepository.findByFieldVisit_Id(visit.getId())
                .map(found -> {
                    visit.setReport(found);
                    return found;
                })
                .orElseGet(() -> {
                    FieldVisitReport created = FieldVisitReport.builder()
                            .fieldVisit(visit)
                            .findings(null)
                            .diagnoses(null)
                            .recommendations(null)
                            .build();
                    fieldVisitReportRepository.save(created);
                    visit.setReport(created);
                    return created;
                });
    }
}

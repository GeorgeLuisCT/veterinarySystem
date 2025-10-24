package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisit;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitAttachment;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitBiosecurity;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitCompanion;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitProductUsage;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitReport;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceAnimal;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceGroup;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceItem;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitServiceProduct;
import com.gaedet.biocampovet.core.inventory.mapper.ProductMapper;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class FieldVisitMapper {
    public static FieldVisitSummaryResponse toSummary(FieldVisit e) {
        return FieldVisitSummaryResponse.builder()
                .id(e.getId())
                .farmId(e.getFarm() != null ? e.getFarm().getId() : null)
                .farmName(e.getFarm() != null ? e.getFarm().getName() : null)
                .zoneId(resolveZoneId(e))
                .zoneName(resolveZoneName(e))
                .scheduledDateTime(e.getScheduledDateTime())
                .status(e.getStatus())
                .fieldVetId(e.getFieldVet() != null ? e.getFieldVet().getId() : null)
                .fieldVetName(e.getFieldVet() != null ? e.getFieldVet().getFullName() : null)
                .vehicleId(e.getVehicle() != null ? e.getVehicle().getId() : null)
                .vehicleName(e.getVehicle() != null ? e.getVehicle().getName() : null)
                .objective(e.getObjective())
                .companions(e.getCompanions() == null ? List.of() : e.getCompanions().stream()
                        .sorted(Comparator.comparing(c -> c.getEmployee().getFullName(), String.CASE_INSENSITIVE_ORDER))
                        .map(FieldVisitMapper::toCompanion)
                        .collect(Collectors.toList()))
                .build();
    }

    public static FieldVisitResponse toResponse(FieldVisit e) {
        return FieldVisitResponse.builder()
                .id(e.getId())
                .farmId(e.getFarm() != null ? e.getFarm().getId() : null)
                .farmName(e.getFarm() != null ? e.getFarm().getName() : null)
                .zoneId(resolveZoneId(e))
                .zoneName(resolveZoneName(e))
                .scheduledDateTime(e.getScheduledDateTime())
                .status(e.getStatus())
                .fieldVetId(e.getFieldVet() != null ? e.getFieldVet().getId() : null)
                .fieldVetName(e.getFieldVet() != null ? e.getFieldVet().getFullName() : null)
                .vehicleId(e.getVehicle() != null ? e.getVehicle().getId() : null)
                .vehicleName(e.getVehicle() != null ? e.getVehicle().getName() : null)
                .objective(e.getObjective())
                .companions(e.getCompanions() == null ? List.of() : e.getCompanions().stream()
                        .sorted(Comparator.comparing(c -> c.getEmployee().getFullName(), String.CASE_INSENSITIVE_ORDER))
                        .map(FieldVisitMapper::toCompanion)
                        .collect(Collectors.toList()))
                .serviceItems(e.getServiceItems() == null ? List.of() : e.getServiceItems().stream().map(FieldVisitMapper::toServiceItem).collect(Collectors.toList()))
                .productUsages(e.getProductUsages() == null ? List.of() : e.getProductUsages().stream().map(FieldVisitMapper::toProductUsage).collect(Collectors.toList()))
                .attachments(e.getAttachments() == null ? List.of() : e.getAttachments().stream().map(FieldVisitMapper::toAttachment).collect(Collectors.toList()))
                .biosecurity(e.getBiosecurity() == null ? null : toBiosecurity(e.getBiosecurity()))
                .report(e.getReport() == null ? null : toReport(e.getReport()))
                .build();
    }

    public static FieldVisitServiceItemResponse toServiceItem(FieldVisitServiceItem it) {
        return FieldVisitServiceItemResponse.builder()
                .id(it.getId())
                .clinicalServiceId(it.getClinicalService().getId())
                .clinicalServiceName(it.getClinicalService().getName())
                .quantity(it.getQuantity())
                .unitPrice(it.getUnitPrice())
                .performedById(it.getPerformedBy() != null ? it.getPerformedBy().getId() : null)
                .performedByName(it.getPerformedBy() != null ? it.getPerformedBy().getFullName() : null)
                .notes(it.getNotes())
                .animals(it.getAnimals() == null ? List.of() : it.getAnimals().stream().map(FieldVisitMapper::toServiceAnimal).collect(Collectors.toList()))
                .groups(it.getGroups() == null ? List.of() : it.getGroups().stream().map(FieldVisitMapper::toServiceGroup).collect(Collectors.toList()))
                .products(it.getProducts() == null ? List.of() : it.getProducts().stream().map(FieldVisitMapper::toServiceProduct).collect(Collectors.toList()))
                .build();
    }

    public static FieldVisitProductUsageResponse toProductUsage(FieldVisitProductUsage it) {
        return FieldVisitProductUsageResponse.builder()
                .id(it.getId())
                .productId(it.getProduct().getId())
                .productName(it.getProduct().getName())
                .unit(it.getUnit())
                .quantityUsed(it.getQuantityUsed())
                .unitPrice(it.getUnitPrice())
                .subtotal(it.getSubtotal())
                .vehicleId(it.getSourceVehicle() != null ? it.getSourceVehicle().getId() : null)
                .vehicleName(it.getSourceVehicle() != null ? it.getSourceVehicle().getName() : null)
                .notes(it.getNotes())
                .build();
    }

    public static FieldVisitAttachmentResponse toAttachment(FieldVisitAttachment it) {
        return FieldVisitAttachmentResponse.builder()
                .id(it.getId())
                .fileName(it.getFileName())
                .fileUrl(it.getFileUrl())
                .mimeType(it.getMimeType())
                .build();
    }

    public static FieldVisitBiosecurityResponse toBiosecurity(FieldVisitBiosecurity b) {
        return FieldVisitBiosecurityResponse.builder()
                .vehicleAndEquipmentCleaned(b.isVehicleAndEquipmentCleaned())
                .ppeUsed(b.isPpeUsed())
                .handHygiene(b.isHandHygiene())
                .notes(b.getNotes())
                .build();
    }

    public static FieldVisitReportResponse toReport(FieldVisitReport report) {
        return FieldVisitReportResponse.builder()
                .id(report.getId())
                .version(report.getVersion())
                .findings(report.getFindings())
                .diagnoses(report.getDiagnoses())
                .recommendations(report.getRecommendations())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private static FieldVisitCompanionResponse toCompanion(FieldVisitCompanion c) {
        return FieldVisitCompanionResponse.builder()
                .employeeId(c.getEmployee().getId())
                .employeeName(c.getEmployee().getFullName())
                .build();
    }

    private static FieldVisitServiceAnimalResponse toServiceAnimal(FieldVisitServiceAnimal entity) {
        var animal = entity.getAnimal();
        return FieldVisitServiceAnimalResponse.builder()
                .id(entity.getId())
                .animalId(animal != null ? animal.getId() : null)
                .animalName(animal != null ? animal.getName() : null)
                .species(animal != null ? animal.getSpecies() : null)
                .breed(animal != null ? animal.getBreed() : null)
                .build();
    }

    private static FieldVisitServiceGroupResponse toServiceGroup(FieldVisitServiceGroup entity) {
        return FieldVisitServiceGroupResponse.builder()
                .id(entity.getId())
                .species(entity.getSpecies())
                .breed(entity.getBreed())
                .quantity(entity.getQuantity())
                .description(entity.getDescription())
                .build();
    }

    private static FieldVisitServiceProductResponse toServiceProduct(FieldVisitServiceProduct entity) {
        return FieldVisitServiceProductResponse.builder()
                .id(entity.getId())
                .product(ProductMapper.toProductSummaryResponse(entity.getProduct()))
                .dose(entity.getDose())
                .unit(entity.getUnit())
                .administrationRoute(entity.getAdministrationRoute())
                .build();
    }

    private static Long resolveZoneId(FieldVisit visit) {
        if (visit.getZone() != null) {
            return visit.getZone().getId();
        }
        if (visit.getFarm() != null && visit.getFarm().getZone() != null) {
            return visit.getFarm().getZone().getId();
        }
        return null;
    }

    private static String resolveZoneName(FieldVisit visit) {
        if (visit.getZone() != null) {
            return visit.getZone().getName();
        }
        if (visit.getFarm() != null && visit.getFarm().getZone() != null) {
            return visit.getFarm().getZone().getName();
        }
        return null;
    }
}

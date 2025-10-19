package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.*;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.inventory.entity.Product;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ClinicalAttentionMapper {

    private ClinicalAttentionMapper() {
    }

    public static ClinicalAttentionSummaryResponse toSummary(ClinicalAttention entity) {
        var attention = entity.getAttention();
        var branch = attention != null ? attention.getBranch() : null;
        var animal = attention != null ? attention.getAnimal() : null;
        var employee = attention != null ? attention.getAttendingEmployee() : null;

        return ClinicalAttentionSummaryResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attention != null ? attention.getId() : null)
                .status(entity.getStatus())
                .visitDate(entity.getVisitDate())
                .animalId(animal != null ? animal.getId() : null)
                .animalName(animal != null ? animal.getName() : null)
                .branch(mapBranch(branch))
                .attendingEmployeeId(employee != null ? employee.getId() : null)
                .attendingEmployeeFullName(buildFullName(employee))
                .build();
    }

    public static ClinicalAttentionDetailResponse toDetail(ClinicalAttention entity) {
        List<MedicationAdministrationResponse> medications = entity.getMedicationAdministrations().stream()
                .sorted(Comparator.comparing(MedicationAdministration::getAdministeredAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ClinicalAttentionMapper::toMedicationResponse)
                .collect(Collectors.toList());

        List<ClinicalServiceItemResponse> services = entity.getServiceItems().stream()
                .sorted(Comparator.comparing(ClinicalServiceItem::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ClinicalAttentionMapper::toServiceItemResponse)
                .collect(Collectors.toList());

        List<SurgicalOrderResponse> orders = entity.getSurgicalOrders().stream()
                .sorted(Comparator.comparing(SurgicalOrder::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(SurgicalOrderMapper::toResponse)
                .collect(Collectors.toList());

        List<LaboratoryRequestResponse> labRequests = entity.getLaboratoryRequests().stream()
                .sorted(Comparator.comparing(LaboratoryRequest::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ClinicalAttentionMapper::toLaboratoryRequestResponse)
                .collect(Collectors.toList());

        Attentions attentionEntity = entity.getAttention();
        AttentionSummaryResponse attentionSummary = AttentionMapper.toSummary(attentionEntity);


        return ClinicalAttentionDetailResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attentionEntity.getId())
                .status(entity.getStatus())
                .visitDate(entity.getVisitDate())
                .subjective(entity.getSubjective())
                .objective(entity.getObjective())
                .assessment(entity.getAssessment())
                .plan(entity.getPlan())
                .weightKg(entity.getWeightKg())
                .temperatureCelsius(entity.getTemperatureCelsius())
                .heartRate(entity.getHeartRate())
                .respiratoryRate(entity.getRespiratoryRate())
                .summary(toSummary(entity))
                .attention(attentionSummary)
                .medicationAdministrations(medications)
                .serviceItems(services)
                .surgicalOrders(orders)
                .laboratoryRequests(labRequests)
                .build();
    }

    public static List<ClinicalAttentionStatusGroupResponse> toStatusGroups(Map<ClinicalAttentionStatus, List<ClinicalAttention>> grouped) {
        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> ClinicalAttentionStatusGroupResponse.builder()
                        .status(entry.getKey())
                        .attentions(entry.getValue().stream()
                                .sorted(Comparator.comparing(ClinicalAttention::getVisitDate,
                                        Comparator.nullsLast(Comparator.reverseOrder())))
                                .map(ClinicalAttentionMapper::toSummary)
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    private static MedicationAdministrationResponse toMedicationResponse(MedicationAdministration entity) {
        Product product = entity.getProduct();
        Employee employee = entity.getAdministeredBy();

        return MedicationAdministrationResponse.builder()
                .id(entity.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .administeredAt(entity.getAdministeredAt())
                .doseAmount(entity.getDoseAmount())
                .doseUnit(entity.getDoseUnit())
                .route(entity.getRoute())
                .frequencyValue(entity.getFrequencyValue())
                .frequencyUnit(entity.getFrequencyUnit())
                .administeredByEmployeeId(employee != null ? employee.getId() : null)
                .administeredByEmployeeFullName(buildFullName(employee))
                .notes(entity.getNotes())
                .build();
    }

    private static ClinicalServiceItemResponse toServiceItemResponse(ClinicalServiceItem entity) {
        var service = entity.getClinicalService();

        return ClinicalServiceItemResponse.builder()
                .id(entity.getId())
                .clinicalServiceId(service.getId())
                .clinicalServiceName(service.getName())
                .clinicalServiceCategory(service.getClinicalServiceCategory())
                .unitPrice(entity.getUnitPrice())
                .quantity(entity.getQuantity())
                .subtotal(entity.getSubtotal())
                .notes(entity.getNotes())
                .build();
    }

    private static LaboratoryRequestResponse toLaboratoryRequestResponse(LaboratoryRequest entity) {
        var laboratory = entity.getLaboratory();
        Employee employee = entity.getRequestingEmployee();

        List<LaboratoryRequestItemResponse> items = entity.getItems().stream()
                .sorted(Comparator.comparing(LaboratoryRequestItem::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ClinicalAttentionMapper::toLaboratoryItemResponse)
                .collect(Collectors.toList());

        return LaboratoryRequestResponse.builder()
                .id(entity.getId())
                .laboratoryId(laboratory != null ? laboratory.getId() : null)
                .laboratoryName(laboratory != null ? laboratory.getName() : null)
                .requestingEmployeeId(employee != null ? employee.getId() : null)
                .requestingEmployeeFullName(buildFullName(employee))
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .clinicalNotes(entity.getClinicalNotes())
                .items(items)
                .build();
    }

    private static LaboratoryRequestItemResponse toLaboratoryItemResponse(LaboratoryRequestItem item) {
        var test = item.getTest();
        return LaboratoryRequestItemResponse.builder()
                .id(item.getId())
                .testId(test != null ? test.getId() : null)
                .testCode(test != null ? test.getCode() : null)
                .testName(test != null ? test.getName() : null)
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .notes(item.getNotes())
                .build();
    }

    private static BranchResponse mapBranch(Branch branch) {
        if (branch == null) {
            return null;
        }
        return new BranchResponse(branch.getId(), branch.getName(), branch.getLocation());
    }

    private static String buildFullName(Employee employee) {
        if (employee == null) {
            return null;
        }
        String first = employee.getFirstName() != null ? employee.getFirstName().trim() : "";
        String last = employee.getLastName() != null ? employee.getLastName().trim() : "";
        return (first + " " + last).trim();
    }
}

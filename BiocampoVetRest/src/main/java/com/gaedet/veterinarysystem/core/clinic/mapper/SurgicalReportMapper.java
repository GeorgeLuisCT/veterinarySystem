package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.animal.mapper.AnimalMapper;
import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.dto.AnestheticDrugResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.PostOperativeIndicationResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalMaterialResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.AnestheticDrug;
import com.gaedet.veterinarysystem.core.clinic.entity.PostOperativeIndication;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalMaterial;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalReport;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public final class SurgicalReportMapper {

    private SurgicalReportMapper() {
    }

    public static SurgicalReportSummaryResponse toSummary(SurgicalReport entity) {
        var attention = entity.getAttention();
        var animal = attention != null ? attention.getAnimal() : null;
        var branch = attention != null ? attention.getBranch() : null;
        var surgeon = entity.getSurgeon();
        var anesthesiologist = entity.getAnesthesiologist();
        var assistant = entity.getAssistant();
        var room = entity.getOperatingRoom();

        return SurgicalReportSummaryResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attention != null ? attention.getId() : null)
                .surgeryStartAt(entity.getSurgeryStartAt())
                .status(entity.getStatus())
                .animalBasicResponse(animal != null ? AnimalMapper.toBasicResponse(animal) : null)
                .clinicalServiceName(attention != null ? attention.getService().getName() : null)
                .branch(mapBranch(branch))
                .surgeonId(surgeon != null ? surgeon.getId() : null)
                .surgeonFullName(buildFullName(surgeon))
                .anesthesiologistId(anesthesiologist != null ? anesthesiologist.getId() : null)
                .anesthesiologistFullName(buildFullName(anesthesiologist))
                .assistantId(assistant != null ? assistant.getId() : null)
                .assistantFullName(buildFullName(assistant))
                .operatingRoomId(room != null ? room.getId() : null)
                .operatingRoomName(room != null ? room.getName() : null)
                .build();
    }

    public static SurgicalReportDetailResponse toDetail(SurgicalReport entity) {
        List<AnestheticDrugResponse> drugs = entity.getAnestheticProtocol().stream()
                .sorted(Comparator.comparing(AnestheticDrug::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(SurgicalReportMapper::toAnestheticDrugResponse)
                .collect(Collectors.toList());

        List<SurgicalMaterialResponse> materials = entity.getMaterialsUsed().stream()
                .sorted(Comparator.comparing(SurgicalMaterial::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(SurgicalReportMapper::toMaterialResponse)
                .collect(Collectors.toList());

        List<PostOperativeIndicationResponse> indications = entity.getPostOperativeIndications().stream()
                .sorted(Comparator.comparing(PostOperativeIndication::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(SurgicalReportMapper::toIndicationResponse)
                .collect(Collectors.toList());

        var surgeon = entity.getSurgeon();
        var anesthesiologist = entity.getAnesthesiologist();
        var assistant = entity.getAssistant();
        var room = entity.getOperatingRoom();
        var attention = entity.getAttention();

        return SurgicalReportDetailResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attention != null ? attention.getId() : null)
                .surgicalOrderId(attention != null ? attention.getSurgicalOrder().getId() : null)
                .status(entity.getStatus())
                .surgeryStartAt(entity.getSurgeryStartAt())
                .surgeryEndAt(entity.getSurgeryEndAt())
                .surgeonId(surgeon != null ? surgeon.getId() : null)
                .surgeonFullName(buildFullName(surgeon))
                .anesthesiologistId(anesthesiologist != null ? anesthesiologist.getId() : null)
                .anesthesiologistFullName(buildFullName(anesthesiologist))
                .assistantId(assistant != null ? assistant.getId() : null)
                .assistantFullName(buildFullName(assistant))
                .operatingRoomId(room != null ? room.getId() : null)
                .operatingRoomName(room != null ? room.getName() : null)
                .monitoring(entity.getMonitoring())
                .findings(entity.getFindings())
                .surgicalTechniqueDescription(entity.getSurgicalTechniqueDescription())
                .summary(toSummary(entity))
                .anestheticProtocol(drugs)
                .materialsUsed(materials)
                .postOperativeIndications(indications)
                .build();
    }

    private static AnestheticDrugResponse toAnestheticDrugResponse(AnestheticDrug entity) {
        Product product = entity.getProduct();
        return AnestheticDrugResponse.builder()
                .id(entity.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .phase(entity.getPhase())
                .doseAmount(entity.getDoseAmount())
                .doseUnit(entity.getDoseUnit())
                .route(entity.getRoute())
                .build();
    }

    private static SurgicalMaterialResponse toMaterialResponse(SurgicalMaterial entity) {
        Product product = entity.getProduct();
        return SurgicalMaterialResponse.builder()
                .id(entity.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .unregisteredProductName(entity.getUnregisteredProductName())
                .quantity(entity.getQuantity())
                .unitType(entity.getUnitType())
                .build();
    }

    private static PostOperativeIndicationResponse toIndicationResponse(PostOperativeIndication entity) {
        Product product = entity.getProduct();
        return PostOperativeIndicationResponse.builder()
                .id(entity.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .nonDrugInstruction(entity.getNonDrugInstruction())
                .doseAmount(entity.getDoseAmount())
                .doseUnit(entity.getDoseUnit())
                .frequencyValue(entity.getFrequencyValue())
                .frequencyUnit(entity.getFrequencyUnit())
                .route(entity.getRoute())
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

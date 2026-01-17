package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.animal.mapper.AnimalMapper;
import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.dto.GroomingMaterialResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.GroomingSessionDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.GroomingSessionSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingMaterialUsed;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingSession;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public final class GroomingSessionMapper {

    private GroomingSessionMapper() {
    }

    public static GroomingSessionSummaryResponse toSummary(GroomingSession entity) {
        var attention = entity.getAttention();
        var animal = attention != null ? attention.getAnimal() : null;
        var branch = attention != null ? attention.getBranch() : null;
        var professional = entity.getAssignedProfessional();

        return GroomingSessionSummaryResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attention != null ? attention.getId() : null)
                .startedAt(entity.getStartedAt())
                .finishedAt(entity.getFinishedAt())
                .status(entity.getStatus())
                .animalBasicResponse(animal != null ? AnimalMapper.toBasicResponse(animal) : null)
                .serviceName(attention != null ? attention.getService().getName() : null)
                .branch(mapBranch(branch))
                .assignedProfessionalId(professional != null ? professional.getId() : null)
                .assignedProfessionalFullName(buildFullName(professional))
                .chargedPrice(entity.getChargedPrice())
                .build();
    }

    public static GroomingSessionDetailResponse toDetail(GroomingSession entity) {
        List<GroomingMaterialResponse> materials = entity.getMaterialsUsed().stream()
                .sorted(Comparator.comparing(GroomingMaterialUsed::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(GroomingSessionMapper::toMaterialResponse)
                .collect(Collectors.toList());

        var attention = entity.getAttention();
        var professional = entity.getAssignedProfessional();

        return GroomingSessionDetailResponse.builder()
                .id(entity.getId())
                .version(entity.getVersion())
                .attentionId(attention != null ? attention.getId() : null)
                .status(entity.getStatus())
                .startedAt(entity.getStartedAt())
                .finishedAt(entity.getFinishedAt())
                .assignedProfessionalId(professional != null ? professional.getId() : null)
                .assignedProfessionalFullName(buildFullName(professional))
                .chargedPrice(entity.getChargedPrice())
                .behaviorNotes(entity.getBehaviorNotes())
                .clinicalObservations(entity.getClinicalObservations())
                .summary(toSummary(entity))
                .materialsUsed(materials)
                .photoUrls(entity.getPhotoUrls() != null ? new ArrayList<>(entity.getPhotoUrls()) : List.of())
                .build();
    }

    private static GroomingMaterialResponse toMaterialResponse(GroomingMaterialUsed entity) {
        Product product = entity.getProduct();
        return GroomingMaterialResponse.builder()
                .id(entity.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .unregisteredProductName(entity.getUnregisteredProductName())
                .quantity(entity.getQuantity())
                .unitType(entity.getUnitType())
                .unitPrice(entity.getUnitPrice())
                .subtotal(entity.getSubtotal())
                .build();
    }

    private static BranchResponse mapBranch(Branch branch) {
        if (branch == null) return null;
        return new BranchResponse(branch.getId(), branch.getName(), branch.getLocation());
    }

    private static String buildFullName(Employee employee) {
        if (employee == null) return null;
        String first = employee.getFirstName() != null ? employee.getFirstName().trim() : "";
        String last = employee.getLastName() != null ? employee.getLastName().trim() : "";
        return (first + " " + last).trim();
    }
}

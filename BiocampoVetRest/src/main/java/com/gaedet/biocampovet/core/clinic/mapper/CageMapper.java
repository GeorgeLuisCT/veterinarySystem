package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.clinic.entity.Cage;
import com.gaedet.biocampovet.core.clinic.dto.CageRequest;
import com.gaedet.biocampovet.core.clinic.dto.CageResponse;
import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;

public class CageMapper {

    public static CageResponse toResponse(Cage cage, Hospitalization current) {
        CageResponse response = new CageResponse();
        response.setId(cage.getId());
        response.setName(cage.getName());
        response.setSize(cage.getSize());
        response.setOccupied(cage.isOccupied());
        if (cage.getBranch() != null) {
            response.setBranchId(cage.getBranch().getId());
            response.setBranchName(cage.getBranch().getName());
        }

        if (current != null) {
            CageResponse.CurrentHospitalizationBrief brief = new CageResponse.CurrentHospitalizationBrief();
            brief.setId(current.getId());
            brief.setAnimalId(current.getAnimal().getId());
            brief.setAnimalName(current.getAnimal().getName());
            brief.setStatus(current.getStatus());
            brief.setAdmissionDate(current.getAdmissionDate());
            brief.setAdmissionTiming(current.getAdmissionTiming());
            brief.setCause(current.getCause());
            brief.setClinicalServiceId(current.getClinicalService() != null ? current.getClinicalService().getId() : null);
            brief.setClinicalServiceName(current.getClinicalService() != null ? current.getClinicalService().getName() : null);
            brief.setAttentionId(current.getAttention() != null ? current.getAttention().getId() : null);
            response.setCurrentHospitalization(brief);
        }

        return response;
    }

    public static Cage toEntity(CageRequest request, Branch branch) {
        Cage cage = new Cage();
        cage.setName(request.getName());
        cage.setSize(request.getSize());
        cage.setBranch(branch);
        cage.setOccupied(false);
        return cage;
    }
}


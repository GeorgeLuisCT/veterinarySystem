package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.clinic.dto.HospitalizationVitalSignResponse;
import com.gaedet.biocampovet.core.clinic.entity.HospitalizationVitalSign;

public class HospitalizationVitalSignMapper {

    private HospitalizationVitalSignMapper() {
    }

    public static HospitalizationVitalSignResponse toResponse(HospitalizationVitalSign vitalSign) {
        HospitalizationVitalSignResponse response = new HospitalizationVitalSignResponse();
        response.setId(vitalSign.getId());
        response.setHospitalizationId(
                vitalSign.getHospitalization() != null ? vitalSign.getHospitalization().getId() : null);
        response.setWeightKg(vitalSign.getWeightKg());
        response.setTemperatureCelsius(vitalSign.getTemperatureCelsius());
        response.setHeartRate(vitalSign.getHeartRate());
        response.setRespiratoryRate(vitalSign.getRespiratoryRate());
        response.setRecordedAt(vitalSign.getRecordedAt());
        if (vitalSign.getRecordedBy() != null) {
            response.setRecordedByEmployeeId(vitalSign.getRecordedBy().getId());
            response.setRecordedByEmployeeFullName(
                    vitalSign.getRecordedBy().getFirstName() + " " + vitalSign.getRecordedBy().getLastName());
        }
        return response;
    }
}

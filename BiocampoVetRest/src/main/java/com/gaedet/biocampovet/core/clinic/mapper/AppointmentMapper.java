package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.clinic.dto.AppointmentDetailResponse;
import com.gaedet.biocampovet.core.clinic.dto.AppointmentSummaryResponse;
import com.gaedet.biocampovet.core.clinic.dto.ClinicalAppointmentDetailResponse;
import com.gaedet.biocampovet.core.clinic.dto.GroomingAppointmentDetailResponse;
import com.gaedet.biocampovet.core.clinic.dto.SurgicalAppointmentDetailResponse;
import com.gaedet.biocampovet.core.clinic.entity.Appointment;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalAppointmentDetail;
import com.gaedet.biocampovet.core.clinic.entity.GroomingAppointmentDetail;
import com.gaedet.biocampovet.core.clinic.entity.SurgicalAppointmentDetail;
import com.gaedet.biocampovet.core.employees.entity.Employee;

public final class AppointmentMapper {

    private AppointmentMapper() {
    }

    public static AppointmentSummaryResponse toSummary(Appointment appointment) {
        Animal animal = appointment.getAnimal();
        Employee assigned = appointment.getAssignedEmployee();

        return AppointmentSummaryResponse.builder()
                .id(appointment.getId())
                .type(appointment.getType())
                .status(appointment.getStatus())
                .startDateTime(appointment.getStartDateTime())
                .estimatedDurationMinutes(appointment.getEstimatedDurationMinutes())
                .branch(mapBranch(appointment.getBranch()))
                .animalId(animal != null ? animal.getId() : null)
                .animalName(animal != null ? animal.getName() : null)
                .assignedEmployeeId(assigned != null ? assigned.getId() : null)
                .assignedEmployeeFullName(assigned != null ? buildFullName(assigned) : null)
                .build();
    }

    public static AppointmentDetailResponse toDetail(Appointment appointment) {
        Animal animal = appointment.getAnimal();
        Employee assigned = appointment.getAssignedEmployee();

        ClinicalAppointmentDetailResponse clinical = mapClinicalDetail(appointment.getClinicalDetail());
        GroomingAppointmentDetailResponse grooming = mapGroomingDetail(appointment.getGroomingDetail());
        SurgicalAppointmentDetailResponse surgical = mapSurgicalDetail(appointment.getSurgicalDetail());

        return AppointmentDetailResponse.builder()
                .id(appointment.getId())
                .type(appointment.getType())
                .status(appointment.getStatus())
                .startDateTime(appointment.getStartDateTime())
                .estimatedDurationMinutes(appointment.getEstimatedDurationMinutes())
                .branch(mapBranch(appointment.getBranch()))
                .animalId(animal != null ? animal.getId() : null)
                .animalName(animal != null ? animal.getName() : null)
                .assignedEmployeeId(assigned != null ? assigned.getId() : null)
                .assignedEmployeeFullName(assigned != null ? buildFullName(assigned) : null)
                .requesterName(appointment.getRequesterName())
                .requesterEmail(appointment.getRequesterEmail())
                .requesterPhone(appointment.getRequesterPhone())
                .requestNotes(appointment.getRequestNotes())
                .clinicalDetail(clinical)
                .groomingDetail(grooming)
                .surgicalDetail(surgical)
                .build();
    }

    private static ClinicalAppointmentDetailResponse mapClinicalDetail(ClinicalAppointmentDetail detail) {
        if (detail == null) {
            return null;
        }

        var service = detail.getClinicalService();
        var veterinarian = detail.getVeterinarian();

        return ClinicalAppointmentDetailResponse.builder()
                .clinicalServiceId(service != null ? service.getId() : null)
                .clinicalServiceName(service != null ? service.getName() : null)
                .veterinarianId(veterinarian != null ? veterinarian.getId() : null)
                .veterinarianFullName(veterinarian != null ? buildFullName(veterinarian) : null)
                .consultationReason(detail.getConsultationReason())
                .clinicalNotes(detail.getClinicalNotes())
                .build();
    }

    private static GroomingAppointmentDetailResponse mapGroomingDetail(GroomingAppointmentDetail detail) {
        if (detail == null) {
            return null;
        }

        var service = detail.getClinicalService();
        var stylist = detail.getStylist();

        return GroomingAppointmentDetailResponse.builder()
                .clinicalServiceId(service != null ? service.getId() : null)
                .clinicalServiceName(service != null ? service.getName() : null)
                .stylistId(stylist != null ? stylist.getId() : null)
                .stylistFullName(stylist != null ? buildFullName(stylist) : null)
                .ownerSpecialNotes(detail.getOwnerSpecialNotes())
                .build();
    }

    private static SurgicalAppointmentDetailResponse mapSurgicalDetail(SurgicalAppointmentDetail detail) {
        if (detail == null) {
            return null;
        }

        var finalService = detail.getFinalService();
        var surgeon = detail.getSurgeon();
        var anesthetist = detail.getAnesthetist();
        var operatingRoom = detail.getOperatingRoom();
        var order = detail.getOrder();

        return SurgicalAppointmentDetailResponse.builder()
                .orderId(order != null ? order.getId() : null)
                .finalServiceId(finalService != null ? finalService.getId() : null)
                .finalServiceName(finalService != null ? finalService.getName() : null)
                .surgeonId(surgeon != null ? surgeon.getId() : null)
                .surgeonFullName(surgeon != null ? buildFullName(surgeon) : null)
                .anesthetistId(anesthetist != null ? anesthetist.getId() : null)
                .anesthetistFullName(anesthetist != null ? buildFullName(anesthetist) : null)
                .operatingRoomId(operatingRoom != null ? operatingRoom.getId() : null)
                .operatingRoomName(operatingRoom != null ? operatingRoom.getName() : null)
                .prepInstructions(detail.getPrepInstructions())
                .build();
    }

    private static String buildFullName(Employee employee) {
        if (employee == null) {
            return null;
        }
        String first = employee.getFirstName() != null ? employee.getFirstName().trim() : "";
        String last = employee.getLastName() != null ? employee.getLastName().trim() : "";
        return (first + " " + last).trim();
    }

    private static BranchResponse mapBranch(Branch branch) {
        if (branch == null) {
            return null;
        }
        return new BranchResponse(branch.getId(), branch.getName(), branch.getLocation());
    }
}

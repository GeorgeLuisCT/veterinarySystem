package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.animal.mapper.AnimalMapper;
import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.dto.AttentionResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.AttentionSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;

public final class AttentionMapper {

    private AttentionMapper() {
    }

    public static AttentionResponse toResponse(Attentions attention) {
        var appointment = attention.getAppointment();
        var branch = attention.getBranch();
        var animal = attention.getAnimal();
        var employee = attention.getAttendingEmployee();
        var service = attention.getService();

        return AttentionResponse.builder()
                .id(attention.getId())
                .appointmentId(appointment != null ? appointment.getId() : null)
                .branch(mapBranch(branch))
                .animalBasicResponse(AnimalMapper.toBasicResponse(animal))
                .attendingEmployeeId(employee != null ? employee.getId() : null)
                .attendingEmployeeFullName(employee != null ? buildFullName(employee) : null)
                .checkInTime(attention.getCheckInTime())
                .type(attention.getType())
                .emergency(attention.isEmergency())
                .status(attention.getStatus())
                .clinicalServiceId(service != null ? service.getId() : null)
                .clinicalServiceName(service != null ? service.getName() : null)
                .build();
    }

    public static AttentionSummaryResponse toSummary(Attentions attention) {
        var appointment = attention.getAppointment();
        var branch = attention.getBranch();
        var animal = attention.getAnimal();
        var employee = attention.getAttendingEmployee();
        var service = attention.getService();
        var order = attention.getSurgicalOrder();

        return AttentionSummaryResponse.builder()
                .id(attention.getId())
                .checkInTime(attention.getCheckInTime())
                .status(attention.getStatus())
                .type(attention.getType())
                .emergency(attention.isEmergency())
                .animalId(animal.getId())
                .animalName(animal.getName())
                .branchId(branch.getId())
                .branchName( branch.getName())
                .attendingEmployeeId(employee.getId())
                .attendingEmployeeFullName(buildFullName(employee))
                .clinicalServiceId(service != null ? service.getId() : null)
                .clinicalServiceName(service != null ? service.getName() : null)
                .appointmentId(appointment != null ? appointment.getId() : null)
                .surgicalOrderId(order != null ? order.getId() : null)
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

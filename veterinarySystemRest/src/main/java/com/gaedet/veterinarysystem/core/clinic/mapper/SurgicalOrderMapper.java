package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalOrderResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalOrderSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;

public final class SurgicalOrderMapper {

    private SurgicalOrderMapper() {
    }

    public static SurgicalOrderResponse toResponse(SurgicalOrder order) {
        var animal = order.getAnimal();
        var room = order.getOperatingRoom();
        var service = order.getRecommendedService();
        var requestedBy = order.getRequestedBy();
        var scheduledDetail = order.getScheduledDetail();
        var appointment = scheduledDetail != null ? scheduledDetail.getAppointment() : null;

        return SurgicalOrderResponse.builder()
                .id(order.getId())
                .animalId(animal != null ? animal.getId() : null)
                .animalName(animal != null ? animal.getName() : null)
                .operationRoomName(room != null ? room.getName() : null)
                .operationRoomId(room != null ? room.getId() : null)
                .recommendedServiceId(service != null ? service.getId() : null)
                .recommendedServiceName(service != null ? service.getName() : null)
                .requestedById(requestedBy != null ? requestedBy.getId() : null)
                .requestedByFullName(requestedBy != null ? buildFullName(requestedBy) : null)
                .status(order.getStatus())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .scheduledAppointmentId(appointment != null ? appointment.getId() : null)
                .scheduledAppointmentStart(appointment != null ? appointment.getStartDateTime() : null)
                .build();
    }

    public static SurgicalOrderSummaryResponse toSummary(SurgicalOrder order) {
        var service = order.getRecommendedService();
        return SurgicalOrderSummaryResponse.builder()
                .id(order.getId())
                .recommendedServiceId(service != null ? service.getId() : null)
                .recommendedServiceName(service != null ? service.getName() : null)
                .status(order.getStatus())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
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
}

package com.gaedet.veterinarysystem.core.users.mapper;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserSummaryResponse toSummary(User user) {
        if (user == null || user.getEmployee() == null) return null;

        Employee employee = user.getEmployee();

        String fullName = employee.getFirstName() + " " + employee.getLastName();

        String branchNames = employee.getEmployeeBranches()
                .stream()
                .map(eb -> eb.getBranch().getName())
                .distinct()
                .collect(Collectors.joining(", "));

        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getRoles() != null ? user.getRoles().size() : 0,
                fullName,
                employee.getEmail(),
                employee.getPhoneNumber(),
                employee.getBurden(),
                branchNames,
                user.isActive()
        );
    }
}

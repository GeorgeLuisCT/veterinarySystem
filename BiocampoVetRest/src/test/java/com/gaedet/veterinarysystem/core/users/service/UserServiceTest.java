package com.gaedet.veterinarysystem.core.users.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import com.gaedet.veterinarysystem.core.users.dto.UserDetailResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.entity.Role;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.core.users.mapper.UserMapper;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, new UserMapper());
    }

    @Test
    void getUserDetailShouldReturnFullPayload() {
        User user = buildUser(true);
        when(userRepository.findAuthBundleById(1L)).thenReturn(Optional.of(user));

        UserDetailResponse response = userService.getUserDetail(1L);

        assertEquals(user.getId(), response.getUserId());
        assertEquals(user.getUsername(), response.getUsername());
        assertEquals(user.getEmployee().getEmail(), response.getEmail());
        assertEquals(user.getEmployee().getEmployeeBranches().size(), response.getBranches().size());
    }

    @Test
    void updateUserStatusShouldPersistNewState() {
        User user = buildUser(true);
        when(userRepository.findAuthBundleById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSummaryResponse response = userService.updateUserStatus(1L, false);

        assertFalse(response.active());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertFalse(captor.getValue().isActive());
    }

    @Test
    void deleteUserShouldThrowWhenHasActiveAssignments() {
        User user = buildUser(true);
        when(userRepository.findAuthBundleById(1L)).thenReturn(Optional.of(user));

        assertThrows(IllegalStateException.class, () -> userService.deleteUser(1L));
    }

    @Test
    void deleteUserShouldDeleteWhenNoActiveAssignments() {
        User user = buildUser(false);
        when(userRepository.findAuthBundleById(1L)).thenReturn(Optional.of(user));

        userService.deleteUser(1L);

        verify(userRepository, times(1)).deleteById(1L);
    }

    private User buildUser(boolean activeBranch) {
        Branch branch = new Branch();
        branch.setId(10L);
        branch.setName("Main");
        branch.setLocation("HQ");

        Employee employee = new Employee();
        employee.setId(5L);
        employee.setFirstName("Jane");
        employee.setLastName("Doe");
        employee.setEmail("jane@example.com");
        employee.setPhoneNumber("987654321");
        employee.setBurden("Manager");

        EmployeeBranch employeeBranch = new EmployeeBranch();
        employeeBranch.setId(99L);
        employeeBranch.setActive(activeBranch);
        employeeBranch.setBranch(branch);
        employeeBranch.setEmployee(employee);
        employee.getEmployeeBranches().add(employeeBranch);

        Role role = new Role();
        role.setId(1L);
        role.setName(RoleName.ROLE_ADMIN);

        User user = new User();
        user.setId(1L);
        user.setUsername("jane.doe");
        user.setPassword("secret");
        user.setActive(true);
        user.setEmployee(employee);
        user.setRoles(Set.of(role));

        return user;
    }
}

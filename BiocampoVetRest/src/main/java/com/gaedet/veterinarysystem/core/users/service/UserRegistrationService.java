package com.gaedet.veterinarysystem.core.users.service;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.users.dto.RegisterRequest;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.entity.Role;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.core.users.mapper.UserMapper;
import com.gaedet.veterinarysystem.core.users.repository.RoleRepository;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class UserRegistrationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
    private final UserMapper userMapper;

    public UserRegistrationService(UserRepository userRepository,
                                   RoleRepository roleRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmployeeRepository employeeRepository,
                                   UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.employeeRepository = employeeRepository;
        this.userMapper = userMapper;
    }

    @Transactional
    public UserSummaryResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setEmployee(employee);

        Set<Role> roles = new HashSet<>();
        for (RoleName roleName : request.getRoles()) {
            Role role = roleRepository.findByName(RoleName.valueOf(roleName.name()))
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        }
        user.setRoles(roles);

        userRepository.save(user);
        return userMapper.toSummary(user);
    }
}

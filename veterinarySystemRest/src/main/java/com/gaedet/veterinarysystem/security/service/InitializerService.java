package com.gaedet.veterinarysystem.security.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.users.entity.Role;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.core.users.repository.RoleRepository;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InitializerService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClinicalServiceRepository clinicalServiceRepository;

    private static final Logger log = LoggerFactory.getLogger(InitializerService.class);

    /** Credenciales del administrador inicial. Si no se definen, NO se crea ningún usuario por defecto. */
    @Value("${app.bootstrap.admin.username:}")
    private String bootstrapAdminUsername;

    @Value("${app.bootstrap.admin.password:}")
    private String bootstrapAdminPassword;

    private boolean initialized = false;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (initialized) {
            return;
        }
        initialized = true;
        ensureSeedDataPresent();
        createAdminUserWithAllRoles();
    }

    /**
     * Los roles salen del enum {@link RoleName}: se crean los que falten (idempotente) en lugar de depender
     * de que data.sql se haya ejecutado. Sucursales y catálogo se avisan por log, sin tumbar el arranque.
     */
    private void ensureSeedDataPresent() {
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                log.info("Rol creado: {}", roleName);
            }
        }
        if (branchRepository.count() == 0) {
            log.warn("No hay sucursales registradas. Cargue los datos iniciales (data.sql: spring.sql.init.mode=always).");
        }
        if (clinicalServiceRepository.count() == 0) {
            log.warn("No hay servicios clínicos registrados. Cargue los datos iniciales o créelos desde el catálogo.");
        }
    }

    private void createAdminUserWithAllRoles() {
        if (userRepository.existsByRoles_Name(RoleName.ROLE_ADMIN)) {
            log.info("Ya existe un administrador; no se crea otro.");
            return;
        }

        // Seguridad: sin credenciales explícitas (variables de entorno) no se crea ningún admin por defecto.
        if (bootstrapAdminUsername == null || bootstrapAdminUsername.isBlank()
                || bootstrapAdminPassword == null || bootstrapAdminPassword.length() < 12) {
            log.warn("No existe ningún administrador y no se definió BOOTSTRAP_ADMIN_USERNAME/BOOTSTRAP_ADMIN_PASSWORD "
                    + "(mínimo 12 caracteres). Defínalos para crear el administrador inicial.");
            return;
        }

        List<Branch> allBranches = branchRepository.findAll();
        if (allBranches.isEmpty()) {
            log.warn("No hay sucursales; no se puede crear el administrador inicial todavía.");
            return;
        }

        Employee adminEmployee = new Employee();
        adminEmployee.setFirstName("Admin");
        adminEmployee.setLastName("User");
        adminEmployee.setEmail("admin@example.com");
        adminEmployee.setPhoneNumber("123456789");
        adminEmployee.setBurden("Administrator");

        Set<EmployeeBranch> employeeBranches = allBranches.stream().map(branch -> {
            EmployeeBranch eb = new EmployeeBranch();
            eb.setBranch(branch);
            eb.setEmployee(adminEmployee);
            eb.setActive(true);
            return eb;
        }).collect(Collectors.toSet());

        adminEmployee.setEmployeeBranches(employeeBranches);
        employeeRepository.save(adminEmployee);

        User admin = new User();
        admin.setUsername(bootstrapAdminUsername.trim());
        admin.setPassword(passwordEncoder.encode(bootstrapAdminPassword));
        admin.setEmployee(adminEmployee);

        Set<Role> roles = new HashSet<>(roleRepository.findAll());
        admin.setRoles(roles);

        userRepository.save(admin);
        log.info("Administrador inicial '{}' creado con todos los roles y sucursales.", admin.getUsername());
    }
}

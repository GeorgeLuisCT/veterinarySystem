package com.gaedet.veterinarysystem.security.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalOrderRepository;
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
    private final AnimalRepository animalRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final SurgicalOrderRepository surgicalOrderRepository;

    private boolean initialized = false;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (initialized) {
            return;
        }
        initialized = true;
        ensureSeedDataPresent();
        createAdminUserWithAllRoles();
        createDefaultSurgicalOrdersIfNotExists();
    }

    private void ensureSeedDataPresent() {
        if (roleRepository.count() == 0) {
            throw new IllegalStateException("No roles found. Verify data.sql was executed.");
        }
        if (branchRepository.count() == 0) {
            throw new IllegalStateException("No branches found. Verify data.sql was executed.");
        }
        if (clinicalServiceRepository.count() == 0) {
            throw new IllegalStateException("No clinical services found. Verify data.sql was executed.");
        }
    }

    private void createAdminUserWithAllRoles() {
        if (userRepository.existsByRoles_Name(RoleName.ROLE_ADMIN)) {
            System.out.println("ℹ️ Admin already exists, skipping creation.");
            return;
        }

        List<Branch> allBranches = branchRepository.findAll();
        if (allBranches.isEmpty()) {
            throw new IllegalStateException("No branches available");
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
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("adminpassword"));
        admin.setEmployee(adminEmployee);

        Set<Role> roles = new HashSet<>(roleRepository.findAll());
        admin.setRoles(roles);

        userRepository.save(admin);
        System.out.println("✅ Admin user created with all roles and assigned to all branches.");
    }

    private void createDefaultSurgicalOrdersIfNotExists() {
        if (surgicalOrderRepository.count() > 0) {
            System.out.println("ℹ️ Ya existen órdenes quirúrgicas, se omite la creación por defecto.");
            return;
        }

        Optional<Animal> animalOpt = animalRepository.findAll().stream().findFirst();
        if (animalOpt.isEmpty()) {
            System.out.println("⚠️ No hay animales registrados; se omite creación de órdenes quirúrgicas de ejemplo.");
            return;
        }

        Optional<Employee> employeeOpt = employeeRepository.findAll().stream().findFirst();
        if (employeeOpt.isEmpty()) {
            System.out.println("⚠️ No hay empleados registrados; se omite creación de órdenes quirúrgicas de ejemplo.");
            return;
        }

        ClinicalService surgicalService = clinicalServiceRepository.findByNameIgnoreCase("Profilaxis Quirúrgica Canina")
                .orElseGet(() -> clinicalServiceRepository.findAll().stream()
                        .filter(service -> service.getClinicalServiceCategory() == ClinicalServiceCategory.SURGERY)
                        .findFirst()
                        .orElse(null));

        if (surgicalService == null) {
            System.out.println("⚠️ No se encontró un servicio quirúrgico, se omite creación de órdenes de ejemplo.");
            return;
        }

        SurgicalOrder order = SurgicalOrder.builder()
                .animal(animalOpt.get())
                .recommendedService(surgicalService)
                .requestedBy(employeeOpt.get())
                .status(SurgicalOrderStatus.PENDING)
                .notes("Orden quirúrgica de ejemplo generada automáticamente.")
                .build();

        surgicalOrderRepository.save(order);
        System.out.println("✅ Orden quirúrgica de ejemplo creada para el animal " + animalOpt.get().getName());
    }
}

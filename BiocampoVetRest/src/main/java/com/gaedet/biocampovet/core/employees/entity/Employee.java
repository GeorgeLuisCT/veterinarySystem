package com.gaedet.biocampovet.core.employees.entity;

import javax.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    private String phoneNumber;

    @Column(nullable = false)
    private String burden;

    @Column(name = "calendar_color_hex")
    private String calendarColorHex;

    @Column(name = "is_field_vet")
    @Builder.Default
    private boolean isFieldVet = false;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmployeeBranch> employeeBranches = new HashSet<>();

    @Transient
    public String getFullName() {
        String f = firstName == null ? "" : firstName.trim();
        String l = lastName == null ? "" : lastName.trim();
        return (f + " " + l).trim();
    }
}

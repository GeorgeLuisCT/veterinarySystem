package com.gaedet.biocampovet.core.customer.entity;

import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "document_type")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class DocumentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = true)
    private String abbreviation;
}

package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import lombok.*;


@Entity @Table(name="field_visit_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldVisitAttachment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id", nullable=false)
    private FieldVisit fieldVisit;

    @Column(nullable=false) private String fileName;
    @Column(nullable=false, length=2048) private String fileUrl;
    private String mimeType;
}

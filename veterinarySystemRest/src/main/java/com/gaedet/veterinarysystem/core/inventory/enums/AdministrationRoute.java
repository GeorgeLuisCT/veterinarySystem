package com.gaedet.veterinarysystem.core.inventory.enums;

import lombok.Getter;

@Getter
public enum AdministrationRoute {
    INTRAMUSCULAR("Intramuscular", "IM"),
    INTRAVENOSA("Intravenosa", "IV"),
    SUBCUTANEA("Subcutánea", "SC"),
    ORAL("Oral", "PO"),            // per os
    TOPICA("Tópica", "TOP"),
    INHALATORIA("Inhalatoria", "INH"),
    INTRADERMICA("Intradérmica", "ID"),
    OFTALMICA("Oftálmica", "OFT"),
    OTICA("Ótica", "OTI"),
    NASAL("Nasal", "NAS"),
    RECTAL("Rectal", "REC"),
    VAGINAL("Vaginal", "VAG"),
    SUBLINGUAL("Sublingual", "SL"),
    BUCAL("Bucal", "BUC");

    private final String label;
    private final String abbreviation;

    AdministrationRoute(String label, String abbreviation) {
        this.label = label;
        this.abbreviation = abbreviation;
    }
}

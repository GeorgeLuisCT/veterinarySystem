export enum AdministrationRoute {
    INTRAMUSCULAR = "INTRAMUSCULAR",
    INTRAVENOSA = "INTRAVENOSA",
    SUBCUTANEA = "SUBCUTANEA",
    ORAL = "ORAL",
    TOPICA = "TOPICA",
    INHALATORIA = "INHALATORIA",
    INTRADERMICA = "INTRADERMICA",
    OFTALMICA = "OFTALMICA",
    OTICA = "OTICA",
    NASAL = "NASAL",
    RECTAL = "RECTAL",
    VAGINAL = "VAGINAL",
    SUBLINGUAL = "SUBLINGUAL",
    BUCAL = "BUCAL",
  }
  
  export const AdministrationRouteMeta: Record<
    AdministrationRoute,
    { label: string; abbreviation: string }
  > = {
    [AdministrationRoute.INTRAMUSCULAR]: { label: "Intramuscular", abbreviation: "IM" },
    [AdministrationRoute.INTRAVENOSA]: { label: "Intravenosa", abbreviation: "IV" },
    [AdministrationRoute.SUBCUTANEA]: { label: "Subcutánea", abbreviation: "SC" },
    [AdministrationRoute.ORAL]: { label: "Oral", abbreviation: "PO" },
    [AdministrationRoute.TOPICA]: { label: "Tópica", abbreviation: "TOP" },
    [AdministrationRoute.INHALATORIA]: { label: "Inhalatoria", abbreviation: "INH" },
    [AdministrationRoute.INTRADERMICA]: { label: "Intradérmica", abbreviation: "ID" },
    [AdministrationRoute.OFTALMICA]: { label: "Oftálmica", abbreviation: "OFT" },
    [AdministrationRoute.OTICA]: { label: "Ótica", abbreviation: "OTI" },
    [AdministrationRoute.NASAL]: { label: "Nasal", abbreviation: "NAS" },
    [AdministrationRoute.RECTAL]: { label: "Rectal", abbreviation: "REC" },
    [AdministrationRoute.VAGINAL]: { label: "Vaginal", abbreviation: "VAG" },
    [AdministrationRoute.SUBLINGUAL]: { label: "Sublingual", abbreviation: "SL" },
    [AdministrationRoute.BUCAL]: { label: "Bucal", abbreviation: "BUC" },
  };
  
  export const AdministrationRouteLabels: Record<AdministrationRoute, string> = Object.fromEntries(
    (Object.values(AdministrationRoute) as AdministrationRoute[]).map((v) => [v, AdministrationRouteMeta[v].label])
  ) as Record<AdministrationRoute, string>;
  
  export const AdministrationRouteAbbreviations: Record<AdministrationRoute, string> = Object.fromEntries(
    (Object.values(AdministrationRoute) as AdministrationRoute[]).map((v) => [v, AdministrationRouteMeta[v].abbreviation])
  ) as Record<AdministrationRoute, string>;
  
  export const AdministrationRouteOptions = (
    Object.values(AdministrationRoute) as AdministrationRoute[]
  ).map((value) => ({
    value,
    label: AdministrationRouteMeta[value].label,
    abbreviation: AdministrationRouteMeta[value].abbreviation,
  }));
  
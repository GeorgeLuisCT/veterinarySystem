export enum GeoZoneType {
  COUNTRY = "COUNTRY",
  REGION = "REGION",
  PROVINCE = "PROVINCE",
  DISTRICT = "DISTRICT",
  SECTOR = "SECTOR",
  CUSTOM = "CUSTOM",
}

export const GeoZoneTypeLabels: Record<GeoZoneType, string> = {
  [GeoZoneType.COUNTRY]: "País",
  [GeoZoneType.REGION]: "Región",
  [GeoZoneType.PROVINCE]: "Provincia",
  [GeoZoneType.DISTRICT]: "Distrito",
  [GeoZoneType.SECTOR]: "Sector",
  [GeoZoneType.CUSTOM]: "Personalizado",
};

export const GeoZoneTypeOptions = (
  Object.values(GeoZoneType) as GeoZoneType[]
).map((value) => ({
  value,
  label: GeoZoneTypeLabels[value],
}));
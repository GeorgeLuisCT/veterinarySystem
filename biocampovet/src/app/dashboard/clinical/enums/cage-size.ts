export enum CageSize {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
  }
  
  export const CageSizeLabels: Record<CageSize, string> = {
    [CageSize.SMALL]: "Pequeña",
    [CageSize.MEDIUM]: "Mediana",
    [CageSize.LARGE]: "Grande",
  };
  
  export const CageSizeOptions = (
    Object.values(CageSize) as CageSize[]
  ).map((value) => ({
    value,
    label: CageSizeLabels[value],
  }));
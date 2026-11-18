export enum LabValueType {
    NUMERIC = "NUMERIC",
    TEXT = "TEXT",
    BOOLEAN = "BOOLEAN",
    SELECT = "SELECT",
}

export const LabValueTypeLabels: Record<LabValueType, string> = {
    [LabValueType.NUMERIC]: "Numérico",
    [LabValueType.TEXT]: "Texto",
    [LabValueType.BOOLEAN]: "Sí / No",
    [LabValueType.SELECT]: "Lista de opciones",
};

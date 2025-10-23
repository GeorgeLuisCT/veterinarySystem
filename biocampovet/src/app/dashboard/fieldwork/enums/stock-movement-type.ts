export enum StockMovementType {
    LOAD_TO_VEHICLE = "LOAD_TO_VEHICLE",
    UNLOAD_TO_WAREHOUSE = "UNLOAD_TO_WAREHOUSE",
    CONSUMPTION = "CONSUMPTION",
    ADJUSTMENT = "ADJUSTMENT",
}

export const StockMovementTypeLabels: Record<StockMovementType, string> = {
    [StockMovementType.LOAD_TO_VEHICLE]: "Carga a vehículo",
    [StockMovementType.UNLOAD_TO_WAREHOUSE]: "Devolución a almacén",
    [StockMovementType.CONSUMPTION]: "Consumo en visita",
    [StockMovementType.ADJUSTMENT]: "Ajuste",
};

export const StockMovementTypeOptions = (
    Object.values(StockMovementType) as StockMovementType[]
).map((value) => ({
    value,
    label: StockMovementTypeLabels[value],
}));

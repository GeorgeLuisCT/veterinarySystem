export enum StockLocationType {
    BRANCH_WAREHOUSE = "BRANCH_WAREHOUSE",
    VEHICLE = "VEHICLE",
    FIELD = "FIELD",
}

export const StockLocationTypeLabels: Record<StockLocationType, string> = {
    [StockLocationType.BRANCH_WAREHOUSE]: "Almacén de sucursal",
    [StockLocationType.VEHICLE]: "Vehículo",
    [StockLocationType.FIELD]: "Campo",
};

export const StockLocationTypeOptions = (
    Object.values(StockLocationType) as StockLocationType[]
).map((value) => ({
    value,
    label: StockLocationTypeLabels[value],
}));
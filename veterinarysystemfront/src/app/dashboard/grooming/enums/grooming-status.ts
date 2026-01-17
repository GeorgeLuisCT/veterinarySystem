export enum GroomingStatus {
    WAITING = "WAITING",
    DRAFT = "DRAFT",
    BATHING = "BATHING",
    DRYING = "DRYING",
    FINISHING = "FINISHING",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
}

export const GroomingStatusLabels: Record<GroomingStatus, string> = {
    [GroomingStatus.WAITING]: "Esperando",
    [GroomingStatus.DRAFT]: "Borrador",
    [GroomingStatus.BATHING]: "En baño",
    [GroomingStatus.DRYING]: "En secado",
    [GroomingStatus.FINISHING]: "En acabado",
    [GroomingStatus.READY_FOR_PICKUP]: "Listo para recoger",
};

export const GroomingStatusOptions = (Object.values(GroomingStatus) as GroomingStatus[]).map((value) => ({
    value,
    label: GroomingStatusLabels[value],
}));

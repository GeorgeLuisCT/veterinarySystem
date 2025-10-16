export enum AnimalSex {
    MALE = "MALE",
    FEMALE = "FEMALE",
    CASTRATED_MALE = "CASTRATED_MALE",
    SPAYED_FEMALE = "SPAYED_FEMALE",
}

export const AnimalSexLabels: Record<AnimalSex, string> = {
    [AnimalSex.MALE]: "Macho",
    [AnimalSex.FEMALE]: "Hembra",
    [AnimalSex.CASTRATED_MALE]: "Macho Castrado",
    [AnimalSex.SPAYED_FEMALE]: "Hembra Esterilizada",
};

export const AnimalSexOptions = (
    Object.values(AnimalSex) as AnimalSex[]
).map((value) => ({
    value,
    label: AnimalSexLabels[value],
}));

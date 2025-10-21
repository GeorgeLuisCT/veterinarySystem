import { LabUnit } from "../enums/lab-unit";
import { LabValueType } from "../enums/lab-value-type";

export interface LaboratoryStateResponse {
    laboratoryId: number;
    laboratoryName: string;
    active: boolean;
}

export interface LaboratoryTestSummaryResponse {
    id: number;
    code: string;
    name: string;
    price: number;
    active: boolean;
    laboratories: LaboratoryStateResponse[];
}

export interface LaboratoryTestResponse extends LaboratoryTestSummaryResponse {
    description?: string | null;
    parameters: LaboratoryTestParameterResponse[];
}

export interface LaboratoryTestParameterResponse {
    id: number;
    name: string;
    valueType: LabValueType;
    unit: LabUnit;
    allowedOptions?: string | null;
    refMin?: number | null;
    refMax?: number | null;
    refText?: string | null;
    decimals?: number | null;
}

export interface LaboratoryTestListParams {
    page?: number;
    size?: number;
    q?: string;
    laboratoryId?: number;
}

export interface LaboratoryTestQuickSearchResponse {
    id: number;
    code: string;
    name: string;
    price: number;
}

import { LabRequestItemStatus } from "../enums/lab-request-item-status";
import { LabRequestStatus } from "../enums/lab-request-status";

import { LaboratoryTestParameterResponse } from "./laboratory-test-response";


export interface LaboratoryResultValueResponse {
    id: number;
    parameterId: number;
    parameterName: string;
    numericValue: number | null;
    textValue: string | null;
    booleanValue: boolean | null;
    unitOverride: string | null;
    outOfRange: boolean | null;
    flag: string | null;
    comment: string | null;
}

export interface LaboratoryRequestItemResponse {
    id: number;
    testId: number;
    testName: string;
    testCode: string;
    status: LabRequestItemStatus;
    notes: string | null;
    requestedAt: string | null;
    processedAt: string | null;
    reportedAt: string | null;
    verifiedAt: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    results: LaboratoryResultValueResponse[];
    parameters: LaboratoryTestParameterResponse[];
}

export interface LaboratoryRequestSummaryResponse {
    id: number;
    animalId: number;
    animalName: string;
    laboratoryId: number;
    laboratoryName: string;
    requestingEmployeeId: number | null;
    requestingEmployeeFullName: string | null;
    status: LabRequestStatus;
    createdAt: string;
}

export interface LaboratoryRequestDetailResponse extends LaboratoryRequestSummaryResponse {
    clinicalNotes: string | null;
    items: LaboratoryRequestItemResponse[];
}

export interface LaboratoryRequestListParams {
    page?: number;
    size?: number;
    statuses?: LabRequestStatus[];
    branchId?: number;
    animalId?: number;
    laboratoryId?: number;
    requestingEmployeeId?: number;
    startDate?: string;
    endDate?: string;
}

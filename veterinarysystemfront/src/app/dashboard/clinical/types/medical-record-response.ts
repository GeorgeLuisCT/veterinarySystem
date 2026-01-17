import { MedicalRecordCategory } from "../enums/medical-record-category";


export interface MedicalRecordSummaryResponse {
    occurredAt: string;
    category: MedicalRecordCategory;
    title: string;
}

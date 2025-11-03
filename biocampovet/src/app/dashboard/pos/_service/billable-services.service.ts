import api from "@/services/api";
import { BillableServiceItem, BillableServiceListParams } from "../_types/billable-service";

const BillableServicesService = {
  async list(params: BillableServiceListParams): Promise<BillableServiceItem[]> {
    const response = await api.get<BillableServiceItem[]>("/sales/billable-items", { params });
    return response.data;
  },
};

export default BillableServicesService;

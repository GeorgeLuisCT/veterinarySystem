import api from "@/services/api";
import { OperatingRoomResponse } from "../types/operating-room-response";

export const OperatingRoomService = {
  listByBranch: async (branchId: number): Promise<OperatingRoomResponse[]> => {
    const response = await api.get<OperatingRoomResponse[]>("/operating-rooms", {
      params: { branchId },
    });

    return response.data;
  },
};

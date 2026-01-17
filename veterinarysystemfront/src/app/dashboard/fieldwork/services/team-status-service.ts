import api from '@/services/api';
import { TeamStatusResponse } from '../types/team-status-response';
import { SetTeamStatusRequest } from '../types/team-status-request';

export const TeamStatusService = {
  list: async (): Promise<TeamStatusResponse[]> => {
    const response = await api.get<TeamStatusResponse[]>('/fieldwork/team-status');
    return response.data;
  },
  setStatus: async (data: SetTeamStatusRequest): Promise<TeamStatusResponse> => {
    const response = await api.put<TeamStatusResponse>('/fieldwork/team-status', data);
    return response.data;
  },
};

export default TeamStatusService;


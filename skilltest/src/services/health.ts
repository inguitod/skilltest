import { api } from "../base/axios";

export type HealthResponse = {
	status: string;
	message: string;
};

export const getHealth = async () => {
	const response = await api.get<HealthResponse>("/api/health");
	return response.data;
};

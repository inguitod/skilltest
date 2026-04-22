import { api } from "../base/axios";
import type { WeatherPlannerResponse } from "../types/weather";

export const getWeatherPlanner = async (city: string, forceRefresh = false) => {
	const response = await api.get<WeatherPlannerResponse>("/api/weather/planner", {
		params: {
			city,
			...(forceRefresh ? { force_refresh: 1 } : {}),
		},
	});
	return response.data;
};

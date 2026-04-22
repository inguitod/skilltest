import { api } from "../base/axios";
import type { WeatherPlannerResponse } from "../types/weather";

export const getWeatherPlanner = async (city: string) => {
	const response = await api.get<WeatherPlannerResponse>("/api/weather/planner", {
		params: { city },
	});
	return response.data;
};

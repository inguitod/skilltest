import { api } from "../base/axios";
import type { LocationSuggestResponse } from "../types/location";

export const getLocationSuggestions = async (q: string) => {
	const response = await api.get<LocationSuggestResponse>("/api/location/suggest", {
		params: { q: q.trim() },
	});
	return response.data;
};

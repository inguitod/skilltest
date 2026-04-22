import { api } from "../base/axios";
import type { LocationSuggestResponse } from "../types/location";

export type LocationSuggestType = "city" | "all";

export const getLocationSuggestions = async (q: string, type: LocationSuggestType = "city") => {
	const response = await api.get<LocationSuggestResponse>("/api/location/suggest", {
		params: { q: q.trim(), type },
	});
	return response.data;
};

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_HISTORY = 24;

export type WeatherHistoryEntry = {
	id: string;
	searchedAt: string;
	city: string;
	country: string | null;
	queryKey: string;
};

type WeatherHistoryState = {
	history: WeatherHistoryEntry[];
	addSearch: (city: string, country: string | null) => void;
	clearHistory: () => void;
};

function normalizeQueryKey(city: string): string {
	return city.trim().toLowerCase();
}

export const useWeatherHistoryStore = create<WeatherHistoryState>()(
	persist(
		(set, get) => ({
			history: [],
			addSearch: (city, country) => {
				const queryKey = normalizeQueryKey(city);
				if (!queryKey) {
					return;
				}
				const entry: WeatherHistoryEntry = {
					id: `${queryKey}-${Date.now()}`,
					searchedAt: new Date().toISOString(),
					city: city.trim(),
					country,
					queryKey,
				};
				const rest = get().history.filter((h) => h.queryKey !== queryKey);
				set({
					history: [entry, ...rest].slice(0, MAX_HISTORY),
				});
			},
			clearHistory: () => set({ history: [] }),
		}),
		{
			name: "aura-weather-history",
			partialize: (state) => ({ history: state.history }),
		},
	),
);

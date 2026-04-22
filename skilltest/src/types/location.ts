export type LocationSuggestion = {
	id: string;
	label: string;
	city: string;
	country: string | null;
	country_code: string | null;
	search_query: string;
};

export type LocationSuggestResponse = {
	suggestions: LocationSuggestion[];
};

export type WeatherPlannerWind = {
	speed_ms: number | null;
	direction_deg: number | null;
	gust_ms: number | null;
};

export type WeatherPlannerWeather = {
	condition: string | null;
	description: string | null;
	icon: string | null;
	icon_url: string | null;
};

export type WeatherPlannerCurrent = {
	temperature_c: number | null;
	feels_like_c: number | null;
	temp_min_c: number | null;
	temp_max_c: number | null;
	humidity_percent: number | null;
	pressure_hpa: number | null;
	visibility_m: number | null;
	clouds_percent: number | null;
	wind: WeatherPlannerWind;
	weather: WeatherPlannerWeather;
	sunrise: number | null;
	sunset: number | null;
	timezone_offset_seconds: number | null;
	measured_at_unix: number | null;
};

export type AirQualityComponents = Record<string, number> | null;

export type WeatherPlannerAirQuality = {
	aqi: number | null;
	aqi_label: string | null;
	components: AirQualityComponents;
};

export type WeatherPlannerForecastItem = {
	at_unix: number | null;
	at_text: string | null;
	temperature_c: number | null;
	feels_like_c: number | null;
	humidity_percent: number | null;
	pressure_hpa: number | null;
	precipitation_probability: number | null;
	wind_speed_ms: number | null;
	wind_direction_deg: number | null;
	visibility_m: number | null;
	clouds_percent: number | null;
	weather: {
		condition: string | null;
		description: string | null;
	};
};

export type WeatherPlannerResponse = {
	city: string;
	country: string | null;
	coordinates: {
		latitude: number;
		longitude: number;
	};
	current: WeatherPlannerCurrent;
	air_quality: WeatherPlannerAirQuality;
	forecast: WeatherPlannerForecastItem[];
};

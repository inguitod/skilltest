import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Cloud,
	CloudRain,
	Compass,
	Droplets,
	Eye,
	Gauge,
	Wind,
} from "lucide-react";
import { AqiBadge } from "@/components/weather/AqiBadge";
import { ForecastConditionIcon } from "@/components/weather/ForecastConditionIcon";
import { SearchBar } from "@/components/weather/SearchBar";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { WeatherMetricCard } from "@/components/weather/WeatherMetricCard";
import { HistorySection } from "@/components/weather/HistorySection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	aqiBadgeTone,
	metersToKm,
	msToKmh,
	pm25Progress,
	windDirectionLabel,
} from "@/lib/weatherFormat";
import {
	apiErrorMessage,
	dateKeyFromText,
	dateKeyFromUnix,
	displayDayShortLabel,
	formatNullable,
	normalizeQueryKey,
	readSearchFromUrl,
	writeSearchToUrl,
} from "@/lib/weatherPlannerPage";
import { cn } from "@/lib/utils";
import { getLocationSuggestions } from "@/services/locationSuggest";
import { getWeatherPlanner } from "@/services/weatherPlanner";
import { useWeatherHistoryStore } from "@/store/useWeatherHistoryStore";
import type { LocationSuggestion } from "@/types/location";
import type { WeatherPlannerResponse } from "@/types/weather";

export function WeatherPlannerPage() {
	const [query, setQuery] = useState("");
	const [data, setData] = useState<WeatherPlannerResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [historyLoadingQueryKey, setHistoryLoadingQueryKey] = useState<string | null>(null);
	const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
	const [suggestLoading, setSuggestLoading] = useState(false);
	const skipSuggestRef = useRef(false);

	const history = useWeatherHistoryStore((s) => s.history);
	const addSearch = useWeatherHistoryStore((s) => s.addSearch);
	const clearHistory = useWeatherHistoryStore((s) => s.clearHistory);

	const runSearch = useCallback(
		async (city: string, forceRefresh = false) => {
			const trimmed = city.trim();
			if (!trimmed) {
				toast.error("Enter a city name.");
				return;
			}
			setLoading(true);
			try {
				const result = await getWeatherPlanner(trimmed, forceRefresh);
				setData(result);
				addSearch(result.city, result.country);
				writeSearchToUrl(result.city);
				setQuery((prev) => {
					if (prev === result.city) {
						return prev;
					}
					skipSuggestRef.current = true;
					return result.city;
				});
			} catch (e) {
				const msg = apiErrorMessage(e);
				toast.error(msg);
			} finally {
				setLoading(false);
				setHistoryLoadingQueryKey(null);
			}
		},
		[addSearch],
	);

	useEffect(() => {
		const initial = readSearchFromUrl();
		if (!initial) {
			return;
		}
		skipSuggestRef.current = true;
		setQuery(initial);
		void runSearch(initial);
	}, [runSearch]);

	useEffect(() => {
		if (skipSuggestRef.current) {
			skipSuggestRef.current = false;
			return;
		}
		const q = query.trim();
		if (q.length < 2) {
			setSuggestions([]);
			setSuggestLoading(false);
			return;
		}
		setSuggestLoading(true);
		setSuggestions([]);
		let cancelled = false;
		const t = setTimeout(() => {
			void getLocationSuggestions(q, "city")
				.then((r) => {
					if (!cancelled) {
						setSuggestions(r.suggestions);
					}
				})
				.catch(() => {
					if (!cancelled) {
						setSuggestions([]);
					}
				})
				.finally(() => {
					if (!cancelled) {
						setSuggestLoading(false);
					}
				});
		}, 350);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [query]);

	const onSubmitSearch = () => {
		const shouldForceRefresh =
			data !== null && normalizeQueryKey(query) === normalizeQueryKey(data.city);
		void runSearch(query, shouldForceRefresh);
	};

	const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
		skipSuggestRef.current = true;
		setSuggestions([]);
		setSuggestLoading(false);
		setQuery(suggestion.label);
		void runSearch(suggestion.search_query);
	};

	const handleHistorySelect = (city: string) => {
		skipSuggestRef.current = true;
		setQuery(city);
		setHistoryLoadingQueryKey(normalizeQueryKey(city));
		void runSearch(city);
	};

	const pm25 = data?.air_quality.components?.pm2_5 ?? null;
	const aqi = data?.air_quality.aqi ?? null;
	const aqiLabel = data?.air_quality.aqi_label;
	const tone = aqiBadgeTone(aqi);
	const badgeLabel = (aqiLabel ?? "Unknown").toUpperCase();

	const windKmh = data ? msToKmh(data.current.wind.speed_ms) : null;
	const windDir = data ? windDirectionLabel(data.current.wind.direction_deg) : null;
	const visKm = data ? metersToKm(data.current.visibility_m) : null;
	const rainPct = data?.forecast[0]?.precipitation_probability ?? null;
	const rainHint = data?.forecast[0]?.weather.description ?? data?.forecast[0]?.weather.condition;
	const todayDateKey = data
		? dateKeyFromUnix(data.current.measured_at_unix, data.current.timezone_offset_seconds)
		: null;
	const dailyForecast = useMemo(() => {
		if (!data) {
			return [];
		}
		const zone = data.current.timezone_offset_seconds;
		const buckets = new Map<
			string,
			{
				temps: number[];
				conditions: string[];
			}
		>();

		for (const item of data.forecast) {
			const key = dateKeyFromText(item.at_text) ?? dateKeyFromUnix(item.at_unix, zone);
			if (!key) {
				continue;
			}
			const entry = buckets.get(key) ?? { temps: [], conditions: [] };
			if (item.temperature_c !== null && item.temperature_c !== undefined) {
				entry.temps.push(item.temperature_c);
			}
			const condition = item.weather.description ?? item.weather.condition;
			if (condition) {
				entry.conditions.push(condition);
			}
			buckets.set(key, entry);
		}

		const rows: Array<{
			dateKey: string;
			dayLabel: string;
			condition: string;
			high: number | null;
			low: number | null;
		}> = [];

		if (todayDateKey) {
			rows.push({
				dateKey: todayDateKey,
				dayLabel: displayDayShortLabel(todayDateKey, true),
				condition: data.current.weather.description ?? data.current.weather.condition ?? "Weather",
				high: data.current.temp_max_c !== null && data.current.temp_max_c !== undefined ? data.current.temp_max_c : null,
				low: data.current.temp_min_c !== null && data.current.temp_min_c !== undefined ? data.current.temp_min_c : null,
			});
		}

		const upcomingKeys = Array.from(buckets.keys())
			.filter((key) => key !== todayDateKey)
			.sort((a, b) => a.localeCompare(b));

		for (const key of upcomingKeys) {
			const bucket = buckets.get(key);
			if (!bucket) {
				continue;
			}
			const high = bucket.temps.length > 0 ? Math.max(...bucket.temps) : null;
			const low = bucket.temps.length > 0 ? Math.min(...bucket.temps) : null;
			rows.push({
				dateKey: key,
				dayLabel: displayDayShortLabel(key, false),
				condition: bucket.conditions[0] ?? "Weather",
				high,
				low,
			});
		}

		return rows.slice(0, 7);
	}, [data, todayDateKey]);

	const progressValue = Math.round(pm25Progress(pm25) * 100);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-12">
				<div className="mb-10 flex flex-col items-center gap-6">
					<h1 className="text-center font-semibold text-3xl tracking-tight text-primary">AuraWeather</h1>
					<SearchBar
						value={query}
						onChange={setQuery}
						onSubmit={onSubmitSearch}
						disabled={loading}
						suggestions={suggestions}
						suggestionsLoading={suggestLoading}
						onSelectSuggestion={handleSelectSuggestion}
					/>
				</div>

				{loading && !data ? (
					<div className="mb-10 space-y-6">
						<Skeleton className="h-80 w-full rounded-3xl lg:h-96" />
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }, (_, i) => (
								<Skeleton key={i} className="min-h-[180px] rounded-xl" />
							))}
						</div>
					</div>
				) : null}

				{data ? (
					<>
						<WeatherHero data={data} />
						<Card className="mb-10 border-border/60 bg-muted/20">
							<CardHeader className="pb-3">
								<CardTitle className="text-2xl font-semibold tracking-tight">7-Day Forecast</CardTitle>
							</CardHeader>
							<CardContent className="px-0 pt-0">
								{dailyForecast.length > 0 ? (
									<ul className="divide-y divide-border/60">
										{dailyForecast.map((item) => (
											<li key={item.dateKey} className="flex items-center justify-between gap-4 px-6 py-4">
												<p className="w-16 font-medium text-foreground/90">{item.dayLabel}</p>
												<div className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
													<ForecastConditionIcon condition={item.condition} />
													<p className="truncate text-sm capitalize">{item.condition}</p>
												</div>
												<div className="flex items-baseline gap-3 text-right tabular-nums">
													<span className="font-semibold text-foreground">
														{item.high !== null ? `${Math.round(item.high)}°` : "—"}
													</span>
													<span className="text-muted-foreground">
														{item.low !== null ? `${Math.round(item.low)}°` : "—"}
													</span>
												</div>
											</li>
										))}
									</ul>
								) : (
									<div className="px-6 pb-4 text-sm text-muted-foreground">No forecast dates available.</div>
								)}
							</CardContent>
						</Card>

						<section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							<WeatherMetricCard
								title="Air quality"
								icon={<Gauge className="size-5" aria-hidden />}
								badge={<AqiBadge tone={tone} label={badgeLabel} />}
							>
								<div className="text-2xl font-semibold tracking-tight">
									{aqi !== null && aqi !== undefined ? `AQI ${aqi}` : "—"}
									{aqiLabel ? (
										<span className="mt-1 block text-base font-normal text-muted-foreground">
											{aqiLabel}
											{pm25 !== null && pm25 !== undefined
												? ` · PM2.5 ${Math.round(pm25 * 10) / 10} μg/m³`
												: ""}
										</span>
									) : (
										<span className="mt-1 block text-base font-normal text-muted-foreground">
											No air quality label from the service.
										</span>
									)}
								</div>
								<Progress
									value={progressValue}
									className={cn(
										"mt-4",
										tone === "good" && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
										tone === "fair" && "[&_[data-slot=progress-indicator]]:bg-lime-500",
										tone === "moderate" && "[&_[data-slot=progress-indicator]]:bg-amber-500",
										tone === "poor" && "[&_[data-slot=progress-indicator]]:bg-red-500",
										tone === "unknown" && "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
									)}
								/>
							</WeatherMetricCard>

							<WeatherMetricCard title="Wind" icon={<Wind className="size-5" aria-hidden />}>
								<div className="flex items-baseline gap-2">
									<span className="text-5xl font-light tabular-nums">
										{formatNullable(windKmh ?? undefined)}
									</span>
									<span className="text-xl text-muted-foreground">km/h</span>
								</div>
								{data.current.wind.gust_ms !== null && data.current.wind.gust_ms !== undefined ? (
									<p className="mt-2 text-sm text-muted-foreground">
										Gusts {formatNullable(msToKmh(data.current.wind.gust_ms) ?? undefined)} km/h
									</p>
								) : null}
								<div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
									<Compass className="size-4 text-primary" aria-hidden />
									<span>{windDir ?? "—"}</span>
								</div>
							</WeatherMetricCard>

							<WeatherMetricCard title="Visibility" icon={<Eye className="size-5" aria-hidden />}>
								<div className="flex items-baseline gap-2">
									<span className="text-5xl font-light tabular-nums">
										{formatNullable(visKm ?? undefined)}
									</span>
									<span className="text-xl text-muted-foreground">km</span>
								</div>
								<p className="mt-4 text-sm text-muted-foreground italic">
									{data.current.visibility_m !== null && data.current.visibility_m !== undefined
										? `Reported visibility ${data.current.visibility_m} m.`
										: "No visibility reading from the service."}
								</p>
							</WeatherMetricCard>

							<WeatherMetricCard title="Cloud cover" icon={<Cloud className="size-5" aria-hidden />}>
								<div className="text-5xl font-light tabular-nums">
									{formatNullable(
										data.current.clouds_percent !== null &&
											data.current.clouds_percent !== undefined
											? data.current.clouds_percent
											: undefined,
										"%",
									)}
								</div>
								<p className="mt-4 text-sm text-muted-foreground">
									Sky coverage from the current observation.
								</p>
							</WeatherMetricCard>

							<WeatherMetricCard title="Humidity" icon={<Droplets className="size-5" aria-hidden />}>
								<div className="text-5xl font-light tabular-nums">
									{formatNullable(
										data.current.humidity_percent !== null &&
											data.current.humidity_percent !== undefined
											? data.current.humidity_percent
											: undefined,
										"%",
									)}
								</div>
								<p className="mt-4 text-sm text-muted-foreground">
									{data.current.feels_like_c !== null && data.current.feels_like_c !== undefined
										? `Feels like ${Math.round(data.current.feels_like_c)}°C.`
										: "Feels-like not reported."}
								</p>
							</WeatherMetricCard>

							<WeatherMetricCard
								title="Rain chance"
								icon={<CloudRain className="size-5" aria-hidden />}
								variant="accent"
							>
								<div className="text-5xl font-light tabular-nums text-primary">
									{rainPct !== null && rainPct !== undefined ? `${rainPct}%` : "—"}
								</div>
								<p className="mt-4 text-sm font-medium text-primary/90">
									{rainHint
										? `Next window: ${rainHint}.`
										: "Probability of precipitation from the next forecast slot (API)."}
								</p>
							</WeatherMetricCard>
						</section>

						<Card className="mb-10">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									Coordinates & pressure
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="grid gap-2 text-sm sm:grid-cols-2">
									<li>
										Lat / lon:{" "}
										<span className="font-mono tabular-nums">
											{data.coordinates.latitude.toFixed(4)}, {data.coordinates.longitude.toFixed(4)}
										</span>
									</li>
									<li>
										Pressure:{" "}
										<span className="tabular-nums">
											{data.current.pressure_hpa !== null && data.current.pressure_hpa !== undefined
												? `${data.current.pressure_hpa} hPa`
												: "—"}
										</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</>
				) : null}

				{!loading && !data ? (
					<div className="mb-10 flex w-full justify-center">
						<Empty className="mx-auto w-full max-w-lg flex-none border-border/60 border-solid bg-muted/20 py-10 text-center">
							<EmptyHeader className="mx-auto w-full max-w-sm items-center text-center">
								<EmptyMedia variant="icon">
									<Cloud className="text-muted-foreground" aria-hidden />
								</EmptyMedia>
								<EmptyTitle>No city loaded</EmptyTitle>
								<EmptyDescription>
									Search for a city to see current conditions from your API.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				) : null}

				<HistorySection
					entries={history}
					onSelectCity={handleHistorySelect}
					onClear={() => clearHistory()}
					loadingCityQueryKey={loading ? historyLoadingQueryKey : null}
				/>
			</main>
		</div>
	);
}

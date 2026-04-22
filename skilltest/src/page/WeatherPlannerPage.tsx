import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
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
import { SearchBar } from "@/components/weather/SearchBar";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { WeatherMetricCard } from "@/components/weather/WeatherMetricCard";
import { HistorySection } from "@/components/weather/HistorySection";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { getLocationSuggestions } from "@/services/locationSuggest";
import { getWeatherPlanner } from "@/services/weatherPlanner";
import { useWeatherHistoryStore } from "@/store/useWeatherHistoryStore";
import type { LocationSuggestion } from "@/types/location";
import type { WeatherPlannerResponse } from "@/types/weather";

function apiErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		return data?.message ?? error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "Something went wrong";
}

function AqiBadge({
	tone,
	label,
}: {
	tone: ReturnType<typeof aqiBadgeTone>;
	label: string;
}) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"text-[10px] font-bold tracking-wide uppercase",
				tone === "good" &&
					"border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
				tone === "fair" &&
					"border-lime-200 bg-lime-100 text-lime-950 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-100",
				tone === "moderate" &&
					"border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
				tone === "poor" &&
					"border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
				tone === "unknown" && "border-muted bg-muted/60 text-muted-foreground",
			)}
		>
			{label}
		</Badge>
	);
}

function formatNullable(n: number | null | undefined, suffix = ""): string {
	if (n === null || n === undefined || Number.isNaN(n)) {
		return "—";
	}
	return `${n}${suffix}`;
}

export function WeatherPlannerPage() {
	const [query, setQuery] = useState("");
	const [data, setData] = useState<WeatherPlannerResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
	const [suggestLoading, setSuggestLoading] = useState(false);
	const skipSuggestRef = useRef(false);

	const history = useWeatherHistoryStore((s) => s.history);
	const addSearch = useWeatherHistoryStore((s) => s.addSearch);
	const clearHistory = useWeatherHistoryStore((s) => s.clearHistory);

	const runSearch = useCallback(
		async (city: string) => {
			const trimmed = city.trim();
			if (!trimmed) {
				toast.error("Enter a city name.");
				return;
			}
			setLoading(true);
			try {
				const result = await getWeatherPlanner(trimmed);
				setData(result);
				addSearch(result.city, result.country);
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
			}
		},
		[addSearch],
	);

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
			void getLocationSuggestions(q)
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

	const onSubmitSearch = () => void runSearch(query);

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
				/>
			</main>
		</div>
	);
}

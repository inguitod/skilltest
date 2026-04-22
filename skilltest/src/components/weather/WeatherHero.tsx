import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeatherPlannerResponse } from "@/types/weather";

type WeatherHeroProps = {
	data: WeatherPlannerResponse;
};

const badgeWeatherClass =
	"rounded-full border-0 bg-white/20 text-white shadow-none backdrop-blur-md hover:bg-white/30";

export function WeatherHero({ data }: WeatherHeroProps) {
	const { current, city, country } = data;
	const temp =
		current.temperature_c !== null && current.temperature_c !== undefined
			? Math.round(current.temperature_c)
			: "—";
	const condition =
		current.weather.description ?? current.weather.condition ?? "Weather";
	const location = [city, country].filter(Boolean).join(", ");

	return (
		<Card className="relative mb-10 h-80 overflow-hidden rounded-3xl border-0 p-0 shadow-lg ring-0 lg:h-96">
			<div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-sky-400 via-orange-300 to-indigo-500" />
			{current.weather.icon_url ? (
				<img
					src={current.weather.icon_url}
					alt=""
					className="pointer-events-none absolute top-6 right-6 z-0 size-28 opacity-90 drop-shadow-lg lg:size-32"
				/>
			) : null}
			<div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
			<CardContent className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end border-0 bg-transparent p-8 text-white shadow-none lg:p-12">
				<div className="mb-2 flex flex-wrap items-end gap-4">
					<h1 className="font-semibold text-6xl leading-none tracking-tight lg:text-7xl">{temp}°</h1>
					<div className="pb-1">
						<p className="text-xl font-semibold capitalize lg:text-2xl">{condition}</p>
						<p className="text-base opacity-90">{location}</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-3">
					{current.temp_max_c !== null && current.temp_max_c !== undefined ? (
						<Badge variant="secondary" className={cn(badgeWeatherClass, "gap-1")}>
							<ArrowUp className="size-3.5" aria-hidden />
							H: {Math.round(current.temp_max_c)}°
						</Badge>
					) : null}
					{current.temp_min_c !== null && current.temp_min_c !== undefined ? (
						<Badge variant="secondary" className={cn(badgeWeatherClass, "gap-1")}>
							<ArrowDown className="size-3.5" aria-hidden />
							L: {Math.round(current.temp_min_c)}°
						</Badge>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

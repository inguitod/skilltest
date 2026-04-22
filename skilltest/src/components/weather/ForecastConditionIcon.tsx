import { Cloud, CloudRain, CloudSun, Sun } from "lucide-react";

function conditionTone(condition: string): "sun" | "partly" | "rain" | "cloudy" {
	const c = condition.toLowerCase();
	if (c.includes("rain") || c.includes("drizzle") || c.includes("shower") || c.includes("storm")) {
		return "rain";
	}
	if (c.includes("clear") || c.includes("sun")) {
		return "sun";
	}
	if (c.includes("partly") || c.includes("few clouds")) {
		return "partly";
	}
	return "cloudy";
}

export function ForecastConditionIcon({ condition }: { condition: string }) {
	const tone = conditionTone(condition);
	if (tone === "sun") {
		return <Sun className="size-4 text-amber-500" aria-hidden />;
	}
	if (tone === "partly") {
		return <CloudSun className="size-4 text-sky-600" aria-hidden />;
	}
	if (tone === "rain") {
		return <CloudRain className="size-4 text-blue-500" aria-hidden />;
	}
	return <Cloud className="size-4 text-slate-400" aria-hidden />;
}

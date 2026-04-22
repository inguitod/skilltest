const DIRECTIONS = [
	"N",
	"NNE",
	"NE",
	"ENE",
	"E",
	"ESE",
	"SE",
	"SSE",
	"S",
	"SSW",
	"SW",
	"WSW",
	"W",
	"WNW",
	"NW",
	"NNW",
] as const;

export function windDirectionLabel(deg: number | null | undefined): string | null {
	if (deg === null || deg === undefined || Number.isNaN(deg)) {
		return null;
	}
	const idx = Math.round(deg / 22.5) % 16;
	return DIRECTIONS[idx] ?? null;
}

export function msToKmh(ms: number | null | undefined): number | null {
	if (ms === null || ms === undefined || Number.isNaN(ms)) {
		return null;
	}
	return Math.round(ms * 3.6 * 10) / 10;
}

export function metersToKm(m: number | null | undefined): number | null {
	if (m === null || m === undefined || Number.isNaN(m)) {
		return null;
	}
	return Math.round((m / 1000) * 10) / 10;
}

export type AqiBadgeTone = "good" | "fair" | "moderate" | "poor" | "unknown";

export function aqiBadgeTone(aqi: number | null | undefined): AqiBadgeTone {
	if (aqi === null || aqi === undefined) {
		return "unknown";
	}
	if (aqi <= 1) {
		return "good";
	}
	if (aqi === 2) {
		return "fair";
	}
	if (aqi === 3) {
		return "moderate";
	}
	return "poor";
}

/** Map PM2.5 µg/m³ to a 0–1 progress value for UI bars (WHO interim targets scale, capped). */
export function pm25Progress(pm25: number | null | undefined): number {
	if (pm25 === null || pm25 === undefined || Number.isNaN(pm25)) {
		return 0;
	}
	const cap = 75;
	return Math.min(1, Math.max(0, pm25 / cap));
}

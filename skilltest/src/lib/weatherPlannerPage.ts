import axios from "axios";

export function apiErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		return data?.message ?? error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "Something went wrong";
}

export function formatNullable(n: number | null | undefined, suffix = ""): string {
	if (n === null || n === undefined || Number.isNaN(n)) {
		return "—";
	}
	return `${n}${suffix}`;
}

export function normalizeQueryKey(value: string): string {
	return value.trim().toLowerCase();
}

function shiftedDate(unixSeconds: number, timezoneOffsetSeconds: number | null | undefined): Date {
	const shift = timezoneOffsetSeconds ?? 0;
	return new Date((unixSeconds + shift) * 1000);
}

export function dateKeyFromUnix(
	unixSeconds: number | null | undefined,
	timezoneOffsetSeconds: number | null | undefined,
): string | null {
	if (unixSeconds === null || unixSeconds === undefined || Number.isNaN(unixSeconds)) {
		return null;
	}
	const d = shiftedDate(unixSeconds, timezoneOffsetSeconds);
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function dateKeyFromText(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}
	const [datePart] = value.split(" ");
	if (!datePart || datePart.length !== 10) {
		return null;
	}
	return datePart;
}

export function displayDayShortLabel(dateKey: string, isToday: boolean): string {
	if (isToday) {
		return "Today";
	}
	const d = new Date(`${dateKey}T00:00:00Z`);
	return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(d);
}

export function readSearchFromUrl(): string {
	if (typeof window === "undefined") {
		return "";
	}
	const params = new URLSearchParams(window.location.search);
	const byQuery = params.get("search");
	if (byQuery && byQuery.trim() !== "") {
		return byQuery.trim();
	}

	// Support path style: /search=Manila
	const prefix = "/search=";
	if (window.location.pathname.startsWith(prefix)) {
		const raw = window.location.pathname.slice(prefix.length);
		const decoded = decodeURIComponent(raw);
		return decoded.trim();
	}

	return "";
}

export function writeSearchToUrl(city: string): void {
	if (typeof window === "undefined") {
		return;
	}
	const trimmed = city.trim();
	if (!trimmed) {
		window.history.replaceState(null, "", "/");
		return;
	}
	window.history.replaceState(null, "", `/search=${encodeURIComponent(trimmed)}`);
}

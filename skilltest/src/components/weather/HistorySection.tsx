import { HistoryCard } from "./HistoryCard";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeatherHistoryEntry } from "@/store/useWeatherHistoryStore";

type HistorySectionProps = {
	entries: WeatherHistoryEntry[];
	onSelectCity: (city: string) => void;
	onClear?: () => void;
	loadingCityQueryKey?: string | null;
};

export function HistorySection({ entries, onSelectCity, onClear, loadingCityQueryKey = null }: HistorySectionProps) {
	if (entries.length === 0) {
		return null;
	}

	return (
		<Card className="border-border/60 bg-muted/25">
			<CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
				<CardTitle className="text-lg font-semibold tracking-tight">Previous searches</CardTitle>
				{onClear ? (
					<CardAction>
						<Button
							variant="link"
							className="h-auto px-0 text-primary"
							onClick={onClear}
							disabled={loadingCityQueryKey !== null}
						>
							Clear
						</Button>
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-4 pt-0 md:grid-cols-2 lg:grid-cols-4">
				{entries.map((entry) => (
					<HistoryCard
						key={entry.id}
						entry={entry}
						onSelect={onSelectCity}
						isLoading={loadingCityQueryKey === entry.queryKey}
						disabled={loadingCityQueryKey !== null}
					/>
				))}
			</CardContent>
		</Card>
	);
}

import { ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { WeatherHistoryEntry } from "@/store/useWeatherHistoryStore";

type HistoryCardProps = {
	entry: WeatherHistoryEntry;
	onSelect: (city: string) => void;
};

export function HistoryCard({ entry, onSelect }: HistoryCardProps) {
	const subtitle = formatDistanceToNow(new Date(entry.searchedAt), { addSuffix: true });
	const label = entry.country ? `${entry.city}, ${entry.country}` : entry.city;

	return (
		<Button
			type="button"
			variant="outline"
			className="group/button h-auto min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left font-normal shadow-xs hover:bg-muted/60"
			onClick={() => onSelect(entry.city)}
		>
			<span className="flex min-w-0 flex-1 items-center gap-4">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
					<Clock className="size-5" aria-hidden />
				</span>
				<span className="min-w-0 text-left">
					<span className="block truncate text-sm font-semibold text-foreground">{label}</span>
					<span className="block text-xs text-muted-foreground">{subtitle}</span>
				</span>
			</span>
			<ChevronRight
				className="size-5 shrink-0 text-muted-foreground transition-colors group-hover/button:text-primary"
				aria-hidden
			/>
		</Button>
	);
}

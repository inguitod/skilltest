import { aqiBadgeTone } from "@/lib/weatherFormat";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AqiBadge({
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

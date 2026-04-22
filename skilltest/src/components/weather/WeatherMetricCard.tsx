import type { ReactNode } from "react";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WeatherMetricCardProps = {
	title: string;
	icon: ReactNode;
	badge?: ReactNode;
	variant?: "default" | "accent";
	children: ReactNode;
};

export function WeatherMetricCard({
	title,
	icon,
	badge,
	variant = "default",
	children,
}: WeatherMetricCardProps) {
	return (
		<Card
			size="sm"
			className={cn(
				"min-h-[180px] justify-between rounded-2xl backdrop-blur-md",
				variant === "default" && "border-border/80 bg-card/85 dark:bg-card/70",
				variant === "accent" &&
					"border-primary/20 bg-primary/5 ring-1 ring-primary/10 dark:bg-primary/10",
			)}
		>
			<CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
				<CardTitle className="flex items-center gap-2 font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					<span className="text-primary">{icon}</span>
					{title}
				</CardTitle>
				{badge ? <CardAction>{badge}</CardAction> : null}
			</CardHeader>
			<CardContent className="flex flex-1 flex-col justify-end pt-0">{children}</CardContent>
		</Card>
	);
}

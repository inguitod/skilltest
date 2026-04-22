import { useId } from "react";
import { Search } from "lucide-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { LocationSuggestion } from "@/types/location";

type SearchBarProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	disabled?: boolean;
	suggestions?: LocationSuggestion[];
	suggestionsLoading?: boolean;
	onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
};

export function SearchBar({
	value,
	onChange,
	onSubmit,
	disabled,
	suggestions = [],
	suggestionsLoading = false,
	onSelectSuggestion,
}: SearchBarProps) {
	const listId = useId();
	const showList = !disabled && (suggestions.length > 0 || suggestionsLoading) && value.trim().length >= 2;

	return (
		<div className="relative w-full max-w-2xl">
			<InputGroup
				className={cn(
					"h-12 rounded-full border-input bg-background pr-1.5 shadow-sm",
					"has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
				)}
			>
				<InputGroupAddon align="inline-start" className="pl-4">
					<Search className="size-5 text-muted-foreground" aria-hidden />
				</InputGroupAddon>
				<InputGroupInput
					type="search"
					value={value}
					disabled={disabled}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onSubmit();
						}
					}}
					autoComplete="off"
					aria-autocomplete="list"
					aria-controls={showList ? listId : undefined}
					aria-expanded={showList}
					placeholder="Search for cities to get the forecast..."
					className="h-12 min-w-0 py-3 text-base"
					aria-label="City search"
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupButton
						type="button"
						variant="default"
						size="icon-sm"
						className="shrink-0 rounded-full"
						onClick={onSubmit}
						disabled={disabled}
						aria-label="Run search"
					>
						<Search className="size-4" />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>

			{showList ? (
				<ul
					id={listId}
					role="listbox"
					className={cn(
						"absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-md",
					)}
				>
					{suggestionsLoading && suggestions.length === 0 ? (
						<li className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
							Searching locations…
						</li>
					) : null}
					{suggestions.map((s) => (
						<li key={s.id} className="list-none" role="option">
							<button
								type="button"
								className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => onSelectSuggestion?.(s)}
							>
								<span className="line-clamp-2 font-medium text-foreground">{s.label}</span>
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

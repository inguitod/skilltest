import { Search } from "lucide-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type SearchBarProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	disabled?: boolean;
};

export function SearchBar({ value, onChange, onSubmit, disabled }: SearchBarProps) {
	return (
		<div className="w-full max-w-2xl">
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
		</div>
	);
}

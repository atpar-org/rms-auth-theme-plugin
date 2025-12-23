import { useMemo, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Country } from "./countries";
import { COUNTRIES } from "./countries";

export function CountrySelect(props: {
    value: Country;
    onChange: (country: Country) => void;
    className?: string;
    disabled?: boolean;
}) {
    const { value, onChange, className, disabled } = props;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(c => {
            const hay = `${c.name} ${c.code} ${c.dialCode}`.toLowerCase();
            return hay.includes(q);
        });
    }, [query]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn("justify-between", className)}
                    disabled={disabled}
                    aria-label="Select country"
                >
                    <span className="truncate">
                        {value.code} +{value.dialCode}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px] p-2">
                <div className="p-1">
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search country"
                        autoFocus
                    />
                </div>
                <div className="max-h-64 overflow-auto p-1">
                    {filtered.map(c => (
                        <DropdownMenuItem
                            key={`${c.code}-${c.dialCode}`}
                            onSelect={() => {
                                onChange(c);
                                setQuery("");
                            }}
                            className="flex items-center justify-between gap-2"
                        >
                            <div className="min-w-0">
                                <div className="truncate">{c.name}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {c.code} · +{c.dialCode}
                                </div>
                            </div>
                            {c.code === value.code && c.dialCode === value.dialCode && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                    {filtered.length === 0 && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">No results</div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}



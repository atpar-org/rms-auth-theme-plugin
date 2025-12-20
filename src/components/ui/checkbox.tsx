import * as React from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, type = "checkbox", ...props }, ref) => {
    return (
        <input
            type={type}
            ref={ref}
            className={cn(
                "h-4 w-4 shrink-0 rounded border border-input bg-background shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "checked:bg-primary checked:text-primary-foreground",
                className
            )}
            {...props}
        />
    );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };



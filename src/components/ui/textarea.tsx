import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-none border-b-2 border-border bg-transparent px-1 py-2 text-base text-foreground shadow-none backdrop-blur-none transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

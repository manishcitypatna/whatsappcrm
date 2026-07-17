"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:h-0.5 data-horizontal:w-full data-horizontal:shadow-inset-sm data-vertical:h-full data-vertical:w-0.5 data-vertical:self-stretch data-vertical:shadow-inset-sm",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

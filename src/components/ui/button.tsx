import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // `isolate` gives every button its own stacking context. Without it,
  // a plain static button with no backdrop-blur/transform paints
  // *behind* the app-wide fixed AnimatedBackground (position:fixed
  // content paints above non-positioned static content regardless of
  // DOM order) — invisible at rest, and briefly visible on :active
  // because the translate-y-px below incidentally creates its own
  // stacking context. That flash-on-press is what made it look like a
  // flicker rather than a permanently missing button.
  "group/button isolate appearance-none inline-flex shrink-0 items-center justify-center rounded-lg bg-clip-padding text-sm font-medium whitespace-nowrap shadow-raised-sm transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:shadow-inset-sm disabled:pointer-events-none disabled:shadow-none aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Solid, opaque backgrounds stay legible when merely dimmed —
        // opacity-50 is fine here.
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/80 disabled:opacity-50",
        // Glass variants sit on the animated page backdrop with only a
        // translucent tint + backdrop-blur — same bg-card token <Card>
        // uses, not --background, which is fully opaque and reads as a
        // flat solid button once painted (the blur has nothing to blur
        // if nothing shows through). No border — shadow-raised-sm
        // (from the base classes) is what reads as the edge here.
        // Hover shifts to a translucent primary tint (still glass —
        // backdrop-blur stays on, the tint just isn't --surface-sunken,
        // which goes *darker* in dark mode, the opposite of a "lit up"
        // hover state) so every outline button — gated CTA or plain —
        // hovers identically instead of each page inventing its own.
        // Dimming the whole element with opacity-50 multiplies that
        // translucency, so disabled text washes out against the
        // backdrop artwork (worst in light mode, where the backdrop is
        // bright). Swap to the opaque --muted surface instead of
        // fading, so disabled state stays readable no matter what's
        // behind it.
        outline:
          "bg-card text-foreground backdrop-blur-[var(--blur-glass)] hover:bg-primary/25 hover:text-primary-foreground aria-expanded:shadow-inset-sm disabled:bg-muted disabled:text-muted-foreground",
        secondary:
          "bg-secondary text-secondary-foreground backdrop-blur-[var(--blur-glass)] hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground disabled:bg-muted disabled:text-muted-foreground",
        ghost:
          "shadow-none bg-transparent hover:bg-surface-sunken hover:text-foreground hover:shadow-raised-sm aria-expanded:bg-surface-sunken aria-expanded:text-foreground aria-expanded:shadow-inset-sm disabled:bg-muted disabled:text-muted-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40 disabled:opacity-50",
        link: "shadow-none text-primary underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

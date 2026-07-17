// next-env.d.ts (which pulls this in) is gitignored and only regenerated
// by `next dev` / `next build`. CI runs `tsc --noEmit` standalone before
// either of those, so without this the compiler can't resolve any
// `import x from "*.webp"` (or .png/.svg/etc) style asset import.
/// <reference types="next/image-types/global" />

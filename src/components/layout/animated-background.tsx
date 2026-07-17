import Image from "next/image";
import bg from "../../../public/images/auth-bg.webp";

/**
 * Fixed, full-viewport backdrop for the whole app. Every glass panel
 * (cards, sidebar, header, dialogs, ...) sits on top of this with
 * backdrop-blur, so this is what gives the app its "something's
 * back there" feel.
 *
 * A tinted scrim keyed off `data-mode` sits over the image so
 * foreground text stays readable against it in both light and dark
 * mode.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <Image
        src={bg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-base-a), var(--bg-base-b))",
          opacity: "var(--bg-scrim-opacity)",
        }}
      />
    </div>
  );
}

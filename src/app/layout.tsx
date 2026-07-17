import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { AppToaster } from "@/components/layout/app-toaster";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { DEFAULT_MODE, MODE_IDS, MODE_STORAGE_KEY } from "@/lib/themes";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "wacrm",
    template: "%s — wacrm",
  },
  description: "Self-hostable CRM template for WhatsApp.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [{ url: "/icon" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#e9ebf1",
  colorScheme: "light dark",
};

// Inline boot script — runs before React hydrates so the user's
// light/dark mode is on the <html> element before first paint.
// Without this every page load flashes the default mode for a frame
// before the React tree mounts and applies the saved one.
//
// Kept dependency-free (no imports, no JSX) — must be a string the
// browser can run as a single <script>. Knowledge of valid mode IDs
// is sourced from the MODE_IDS constant so adding a mode doesn't
// silently break the boot path.
const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var MODE_KEY = ${JSON.stringify(MODE_STORAGE_KEY)};
    var DEFAULT_MODE_ = ${JSON.stringify(DEFAULT_MODE)};
    var ALLOWED_MODES = ${JSON.stringify(MODE_IDS)};
    var savedMode = localStorage.getItem(MODE_KEY);
    var mode = ALLOWED_MODES.indexOf(savedMode) !== -1 ? savedMode : DEFAULT_MODE_;
    document.documentElement.dataset.mode = mode;
  } catch (_e) {
    document.documentElement.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-mode={DEFAULT_MODE}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-transparent text-foreground font-sans">
        <AnimatedBackground />
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

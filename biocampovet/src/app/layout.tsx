import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import PaletteSentinel from "@/components/_palette-sentinel";

export const metadata: Metadata = {
  title: "BiocampoVet | Veterinaria integral y bienestar animal",
  description: "Clínica veterinaria con atención 24/7, historial clínico digital y solicitud de citas en línea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://tweakcn.com/live-preview.min.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            let theme = localStorage.getItem("theme") || "system";
            if (theme === "system") {
              theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            document.documentElement.classList.add(theme);
          })();
        `}} />
      </head>
      <body>
        <PaletteSentinel />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

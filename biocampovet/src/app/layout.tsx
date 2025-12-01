import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import PaletteSentinel from "@/components/_palette-sentinel";

export const metadata: Metadata = {
  title: "Veterinaria Coryvet | Veterinaria integral y bienestar animal",
  description: "Clínica veterinaria con atención 24/7, historial clínico digital y solicitud de citas en línea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>

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

import { ReactNode } from "react";
import { SessionProvider } from "@/lib/contexts/session-context";
import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Vera",
  description:
    "Accessibility-first live conversation UI with Groq-backed speech, LangGraph orchestration, and Pretext-backed layout.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vera"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

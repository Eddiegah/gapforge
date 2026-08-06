"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { ProgressBar } from "@/components/progress-bar";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider>
          <ProgressBar />
          <CommandPalette />
          <PageTransition>
            {children}
          </PageTransition>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

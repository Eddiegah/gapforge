"use client";

import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return localStorage.getItem("theme") ?? (enableSystem ? "system" : defaultTheme);
  });

  React.useEffect(() => {
    const root = document.documentElement;

    if (disableTransitionOnChange) {
      root.style.setProperty("transition", "none");
      requestAnimationFrame(() => root.style.removeProperty("transition"));
    }

    const applyTheme = (t: string) => {
      const isDark =
        t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
      if (attribute === "class") {
        root.classList.toggle("light", !isDark);
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme, attribute, disableTransitionOnChange]);

  const value = React.useMemo(
    () => ({ theme, setTheme: (t: string) => { setTheme(t); localStorage.setItem("theme", t); } }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

export function useTheme() {
  return React.useContext(ThemeContext);
}

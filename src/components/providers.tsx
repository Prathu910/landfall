"use client";
import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
  type CSSVariablesResolver,
} from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { MotionConfig } from "motion/react";
import { INK_RAMP, NIGHT_RAMP } from "@/lib/brand/palette";
import { THEME_STORAGE_KEY } from "@/lib/brand/theme";

const theme = createTheme({
  respectReducedMotion: true,
  primaryColor: "ink",
  primaryShade: { light: 9, dark: 0 },
  autoContrast: true,
  defaultRadius: "md",
  fontFamily: "Inter, Arial, sans-serif",
  headings: { fontFamily: "Newsreader, Georgia, serif", fontWeight: "600" },
  colors: { ink: [...INK_RAMP], dark: [...NIGHT_RAMP] },
  components: {
    InputWrapper: { defaultProps: { size: "md" } },
    Select: {
      defaultProps: {
        size: "md",
        comboboxProps: {
          transitionProps: { transition: "pop", duration: 150 },
          shadow: "lg",
        },
      },
    },
    TextInput: { defaultProps: { size: "md" } },
    NumberInput: { defaultProps: { size: "md" } },
    Button: { defaultProps: { size: "md", radius: "md" } },
    Tooltip: { defaultProps: { withArrow: true, multiline: true, maw: 280 } },
  },
});

/**
 * At night Mantine's surfaces (dropdowns, the date picker, the drawer,
 * accordions) take our tokens instead of its own greys. Light keeps
 * Mantine's defaults, as before dark mode.
 */
const resolveCssVariables: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    "--mantine-color-body": "var(--brand-paper)",
    "--mantine-color-text": "var(--ink)",
    "--mantine-color-bright": "var(--ink)",
    "--mantine-color-dimmed": "var(--brand-muted)",
    "--mantine-color-placeholder": "var(--brand-muted)",
    "--mantine-color-anchor": "var(--slate)",
    "--mantine-color-error": "var(--check-error)",
    "--mantine-color-default": "var(--card)",
    "--mantine-color-default-hover": "var(--brand-sage)",
    "--mantine-color-default-color": "var(--ink)",
    "--mantine-color-default-border": "var(--input-border)",
    "--mantine-color-disabled": "var(--brand-sage)",
    "--mantine-color-disabled-color": "var(--brand-muted)",
    "--mantine-color-disabled-border": "var(--brand-line)",
  },
});

const colorSchemeManager = localStorageColorSchemeManager({
  key: THEME_STORAGE_KEY,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
      cssVariablesResolver={resolveCssVariables}
    >
      <DatesProvider settings={{ locale: "en", firstDayOfWeek: 1 }}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </DatesProvider>
    </MantineProvider>
  );
}

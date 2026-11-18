"use client";
import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { MotionConfig } from "motion/react";
const theme = createTheme({
  respectReducedMotion: true,
  primaryColor: "ink",
  primaryShade: 0,
  defaultRadius: "md",
  fontFamily: "Inter, Arial, sans-serif",
  headings: { fontFamily: "Newsreader, Georgia, serif", fontWeight: "600" },
  colors: {
    ink: [
      "#1B1A17",
      "#2E2C27",
      "#4A463E",
      "#6B6558",
      "#948B77",
      "#B9AF9A",
      "#DDD4C2",
      "#ECE7DC",
      "#F3EEE3",
      "#FBF8F2",
    ],
  },
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
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <DatesProvider settings={{ locale: "en", firstDayOfWeek: 1 }}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </DatesProvider>
    </MantineProvider>
  );
}

"use client";
import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { MotionConfig } from "motion/react";
const theme = createTheme({
  respectReducedMotion: true,
  primaryColor: "ink",
  primaryShade: 9,
  defaultRadius: "md",
  fontFamily: "Inter, Arial, sans-serif",
  headings: { fontFamily: "Newsreader, Georgia, serif", fontWeight: "600" },
  colors: {
    ink: [
      "#FBF8F2",
      "#F3EEE3",
      "#ECE7DC",
      "#DDD4C2",
      "#B9AF9A",
      "#948B77",
      "#6B6558",
      "#4A463E",
      "#2E2C27",
      "#1B1A17",
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

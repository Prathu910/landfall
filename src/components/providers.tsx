"use client";
import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { MotionConfig } from "motion/react";
const theme = createTheme({
  respectReducedMotion: true,
  primaryColor: "forest",
  primaryShade: 7,
  defaultRadius: "md",
  fontFamily: '"DM Sans", Arial, sans-serif',
  headings: { fontFamily: '"DM Sans", Arial, sans-serif', fontWeight: "600" },
  colors: {
    forest: [
      "#edf9f2",
      "#daf1e4",
      "#b3e3ca",
      "#88d4ae",
      "#61c797",
      "#46bd88",
      "#32b17b",
      "#127b61",
      "#12614e",
      "#102e29",
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

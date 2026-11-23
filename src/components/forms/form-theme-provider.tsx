"use client";

import { MantineThemeProvider, createTheme } from "@mantine/core";
import type { ReactNode } from "react";
import { formComponents, formScope } from "./form-theme";

const formTheme = createTheme({ components: formComponents });

/** The approved form controls without the points check's own styles. */
export function FormTheme({ children }: { children: ReactNode }) {
  return (
    <MantineThemeProvider theme={formTheme}>
      <div className={formScope}>{children}</div>
    </MantineThemeProvider>
  );
}

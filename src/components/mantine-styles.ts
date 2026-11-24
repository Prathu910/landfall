/**
 * Mantine's stylesheet, cut to the components the site renders. The full
 * `@mantine/core/styles.css` is about 300 KB and was render-blocking on every
 * page (Lighthouse, 24 Nov 2026). Files keep the order they have inside
 * styles.css, and this module is imported by the root layout before
 * globals.css, so the cascade is unchanged. `mantine-styles.test.ts` walks
 * Mantine's own imports and fails when a component is used without its
 * stylesheet, or a stylesheet is listed that nothing uses.
 */
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/core/styles/ScrollArea.css";
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/VisuallyHidden.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Overlay.css";
import "@mantine/core/styles/Popover.css";
import "@mantine/core/styles/Loader.css";
import "@mantine/core/styles/ActionIcon.css";
import "@mantine/core/styles/CloseButton.css";
import "@mantine/core/styles/ModalBase.css";
import "@mantine/core/styles/Input.css";
import "@mantine/core/styles/FloatingIndicator.css";
import "@mantine/core/styles/Accordion.css";
import "@mantine/core/styles/Alert.css";
import "@mantine/core/styles/Combobox.css";
import "@mantine/core/styles/InlineInput.css";
import "@mantine/core/styles/CheckboxCard.css";
import "@mantine/core/styles/CheckboxIndicator.css";
import "@mantine/core/styles/Checkbox.css";
import "@mantine/core/styles/Badge.css";
import "@mantine/core/styles/Burger.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Drawer.css";
import "@mantine/core/styles/NumberInput.css";
import "@mantine/core/styles/Progress.css";
import "@mantine/core/styles/RadioCard.css";
import "@mantine/core/styles/RadioIndicator.css";
import "@mantine/core/styles/Radio.css";
import "@mantine/core/styles/SegmentedControl.css";
import "@mantine/dates/styles.css";

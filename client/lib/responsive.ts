export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const RESPONSIVE_GRID = {
  twoCol: "grid-cols-1 sm:grid-cols-2",
  threeCol: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  fourCol: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  sixCol: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export const RESPONSIVE_PADDING = {
  container: "px-4 sm:px-6 lg:px-8",
  section: "p-4 sm:p-6",
  card: "p-4 sm:p-6",
  compact: "p-3 sm:p-4",
};

export const RESPONSIVE_GAPS = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
  xl: "gap-6 sm:gap-8",
};

export const RESPONSIVE_TEXT = {
  h1: "text-2xl sm:text-3xl lg:text-4xl",
  h2: "text-xl sm:text-2xl lg:text-3xl",
  h3: "text-lg sm:text-xl lg:text-2xl",
  h4: "text-base sm:text-lg lg:text-xl",
  body: "text-sm sm:text-base",
  small: "text-xs sm:text-sm",
};

export const RESPONSIVE_SIDEBAR = {
  width: "w-64",
  widthMobile: "w-56 sm:w-64",
  marginMobile: "ml-0 lg:ml-64",
  hidden: "hidden lg:block",
  visible: "block lg:hidden",
};

export const RESPONSIVE_DIALOG = {
  width: "w-full max-w-lg sm:max-w-2xl",
  padding: "p-4 sm:p-6",
};

export const RESPONSIVE_FORM = {
  twoCol: "grid-cols-1 sm:grid-cols-2",
  threeCol: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  gridGap: "gap-4 sm:gap-6",
};

export const RESPONSIVE_BUTTONS = {
  spacing: "space-x-2 sm:space-x-3",
  stacked: "flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3",
};

export type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  if (width < BREAKPOINTS["2xl"]) return "xl";
  return "2xl";
}

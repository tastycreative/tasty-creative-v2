/**
 * Gallery Theme Constants for GIF Maker
 * Matches the POD-NEW gallery theme design system
 */

export const GalleryTheme = {
  // Background gradients
  background: {
    light: "bg-pink-50/30",
    dark: "dark:bg-gray-950",
    full: "bg-pink-50/30 dark:bg-gray-950",
  },

  // Sidebar backgrounds
  sidebar: {
    light: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30",
    dark: "dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30",
    full: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30",
  },

  // Card backgrounds
  card: {
    light: "bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20",
    dark: "dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30",
    full: "bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30",
  },

  // Radial pattern overlay
  pattern: {
    radial: "bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]",
    opacity: "opacity-[0.02] dark:opacity-[0.05]",
  },

  // Decorative circles
  decorative: {
    topRight:
      "absolute top-3 right-3 w-16 h-16 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse",
    bottomLeft:
      "absolute bottom-3 left-3 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse delay-1000",
  },

  // Typography gradients
  title: {
    light: "from-gray-900 via-pink-600 to-purple-600",
    dark: "dark:from-white dark:via-pink-400 dark:to-purple-400",
    full: "bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent",
  },

  // Icon boxes
  iconBox: {
    pink: "bg-gradient-to-br from-pink-500/10 to-purple-500/10",
    blue: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
    emerald: "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
    purple: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    gradient: "bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500",
  },

  // Borders
  border: {
    light: "border-gray-200/60",
    dark: "dark:border-gray-700/60",
    full: "border border-gray-200/60 dark:border-gray-700/60",
    subtle: "border-gray-200/30 dark:border-gray-700/30",
  },

  // Buttons and interactive elements
  button: {
    primary:
      "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600",
    secondary: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
  },

  // Tab system
  tab: {
    active:
      "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-lg shadow-pink-500/20 dark:shadow-pink-400/20",
    inactive:
      "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50",
    indicator: "bg-gradient-to-r from-pink-500 to-purple-500",
  },

  // Stat cards (for any metrics)
  statCard: {
    pink: "bg-gradient-to-br from-pink-500/10 to-pink-500/5",
    emerald: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5",
    blue: "bg-gradient-to-br from-blue-500/10 to-blue-500/5",
    purple: "bg-gradient-to-br from-purple-500/10 to-purple-500/5",
  },

  // Hover effects
  hover: {
    scale: "hover:scale-105",
    shadow: "hover:shadow-lg",
    both: "hover:scale-105 hover:shadow-lg transition-all duration-300",
  },

  // Text colors
  text: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-600 dark:text-gray-400",
    muted: "text-gray-500 dark:text-gray-500",
  },

  // Timeline specific
  timeline: {
    background: "bg-gray-50 dark:bg-slate-900",
    toolbar: "bg-white dark:bg-slate-800",
    border: "border-gray-200 dark:border-slate-700",
  },
} as const;

// Utility function to combine theme classes
export const galleryClasses = (...classes: string[]) => classes.filter(Boolean).join(" ");

// Export individual theme sections for easier imports
export const {
  background,
  sidebar,
  card,
  pattern,
  decorative,
  title,
  iconBox,
  border,
  button,
  tab,
  statCard,
  hover,
  text,
  timeline,
} = GalleryTheme;

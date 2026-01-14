/**
 * Gallery Theme Constants for GIF Maker
 * Matches the POD-NEW gallery theme design system
 */

export const GalleryTheme = {
  // Background gradients
  background: {
    light: "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50",
    dark: "dark:bg-[#121216]",
    full: "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:bg-[#121216]",
  },

  // Sidebar backgrounds
  sidebar: {
    light: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30",
    dark: "dark:from-[#121216] dark:via-[#121216] dark:to-purple-900/10",
    full: "bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-[#121216] dark:via-[#121216] dark:to-purple-900/10",
  },

  // Card backgrounds
  card: {
    light: "bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20",
    dark: "dark:from-[#121216] dark:via-[#121216] dark:to-purple-900/20",
    full: "bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 dark:from-[#121216] dark:via-[#121216] dark:to-purple-900/20",
  },

  // Radial pattern overlay
  pattern: {
    radial: "bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]",
    opacity: "opacity-[0.02] dark:opacity-[0.05]",
  },

  // Decorative circles
  decorative: {
    topRight:
      "absolute top-3 right-3 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse",
    bottomLeft:
      "absolute bottom-3 left-3 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse delay-1000",
  },

  // Typography gradients
  title: {
    light: "from-gray-900 via-pink-600 to-purple-600",
    dark: "dark:from-gray-100 dark:via-pink-400 dark:to-purple-400",
    full: "bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent",
  },

  // Icon boxes
  iconBox: {
    pink: "bg-gradient-to-br from-pink-500/10 to-purple-500/10",
    blue: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
    emerald: "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
    purple: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    gradient: "bg-pink-500/10 dark:bg-pink-500/20 border border-pink-300/50 dark:border-pink-500/30",
  },

  // Borders
  border: {
    light: "border-pink-200/60",
    dark: "dark:border-pink-500/20",
    full: "border border-pink-200/60 dark:border-pink-500/20",
    subtle: "border-pink-200/30 dark:border-pink-500/10",
  },

  // Buttons and interactive elements
  button: {
    primary:
      "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30",
    secondary: "bg-white/70 dark:bg-[#1a1a1f] hover:bg-pink-50/50 dark:hover:bg-pink-500/10 border border-pink-200/60 dark:border-pink-500/20",
    ghost: "hover:bg-pink-50/50 dark:hover:bg-pink-500/10",
  },

  // Tab system
  tab: {
    active:
      "bg-white dark:bg-[#1a1a1f] text-pink-600 dark:text-pink-400 shadow-lg shadow-pink-500/20 dark:shadow-pink-400/20",
    inactive:
      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-pink-500/10",
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
    background: "bg-white/50 dark:bg-[#121216]",
    toolbar: "bg-white/80 dark:bg-[#121216]",
    border: "border-pink-200/60 dark:border-pink-500/20",
  },

  // Input elements
  input: {
    base: "bg-white/70 dark:bg-[#1a1a1f] border-pink-200/60 dark:border-pink-500/20 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-pink-500/20",
  },

  // Export button
  exportButton: {
    default: "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30",
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

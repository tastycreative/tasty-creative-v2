// Shared utilities for models feature

/**
 * Format large numbers with K/M/B suffix
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format guaranteed amount with safe parsing
 */
export const formatGuaranteedAmount = (guaranteedStr?: string | number | null): string => {
  if (guaranteedStr === null || guaranteedStr === undefined) return "0";

  const str = String(guaranteedStr).trim();
  if (str === "" || str === "-") return "0";

  const cleanValue = str.replace(/[^0-9.-]/g, "");
  const guaranteed = parseFloat(cleanValue);

  if (!isNaN(guaranteed) && guaranteed > 0) {
    return formatCompactNumber(guaranteed);
  }

  return "0";
};

/**
 * Parse guaranteed amount to number
 */
export const parseGuaranteedAmount = (guaranteedStr?: string | number | null): number => {
  if (guaranteedStr === null || guaranteedStr === undefined) return 0;

  const str = String(guaranteedStr).trim();
  if (str === "" || str === "-") return 0;

  const cleanValue = str.replace(/[^0-9.-]/g, "");
  const guaranteed = parseFloat(cleanValue);

  return isNaN(guaranteed) ? 0 : guaranteed;
};

/**
 * Calculate performance score based on revenue and subscribers
 */
export const calculatePerformanceScore = (stats?: {
  monthlyRevenue?: number;
  subscribers?: number;
}): number => {
  if (!stats) return 0;

  const revenue = stats.monthlyRevenue || 0;
  const subscribers = stats.subscribers || 0;

  // Weighted scoring algorithm (0-100)
  const revenueScore = Math.min(100, (revenue / 50000) * 100);
  const subscriberScore = Math.min(100, (subscribers / 10000) * 100);

  return Math.round(revenueScore * 0.4 + subscriberScore * 0.6);
};

/**
 * Personality type color configuration
 */
export interface PersonalityTypeConfig {
  bg: string;
  text: string;
  icon: string;
}

export const getPersonalityTypeConfig = (
  type: string | undefined | null
): PersonalityTypeConfig => {
  const defaultConfig: PersonalityTypeConfig = {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: "text-gray-500",
  };

  if (!type) return defaultConfig;

  const typeLower = type.toLowerCase().trim();

  const configs: Record<string, PersonalityTypeConfig> = {
    expressive: {
      bg: "bg-pink-50 dark:bg-pink-900/20",
      text: "text-pink-700 dark:text-pink-300",
      icon: "text-pink-500",
    },
    outgoing: {
      bg: "bg-pink-50 dark:bg-pink-900/20",
      text: "text-pink-700 dark:text-pink-300",
      icon: "text-pink-500",
    },
    analytical: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500",
    },
    logical: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500",
    },
    driver: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-700 dark:text-orange-300",
      icon: "text-orange-500",
    },
    ambitious: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-700 dark:text-orange-300",
      icon: "text-orange-500",
    },
    amiable: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-300",
      icon: "text-green-500",
    },
    friendly: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-300",
      icon: "text-green-500",
    },
    creative: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-700 dark:text-purple-300",
      icon: "text-purple-500",
    },
    artistic: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-700 dark:text-purple-300",
      icon: "text-purple-500",
    },
  };

  // Find matching config
  for (const [key, config] of Object.entries(configs)) {
    if (typeLower.includes(key)) {
      return config;
    }
  }

  return defaultConfig;
};

/**
 * Format date in a friendly way
 */
export const formatModelDate = (
  date: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return "No date";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return new Date(date).toLocaleDateString("en-US", options || defaultOptions);
};

/**
 * Check if model was launched within last N days
 */
export const isRecentModel = (launchDate: string | undefined | null, days = 30): boolean => {
  if (!launchDate) return false;

  const launch = new Date(launchDate);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return launch >= cutoff;
};

/**
 * Check if model is high revenue (guaranteed > threshold)
 */
export const isHighRevenueModel = (
  guaranteed: string | number | null | undefined,
  threshold = 10000
): boolean => {
  const amount = parseGuaranteedAmount(guaranteed);
  return amount > threshold;
};

/**
 * Stats card color configuration
 */
export type StatsColorType = "primary" | "success" | "warning" | "info";

export interface StatsColorConfig {
  gradient: string;
  iconBg: string;
  iconColor: string;
}

export const getStatsColorConfig = (color: StatsColorType): StatsColorConfig => {
  const configs: Record<StatsColorType, StatsColorConfig> = {
    primary: {
      gradient: "from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    success: {
      gradient: "from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      gradient: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    info: {
      gradient: "from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  };

  return configs[color];
};

import { DateTime, Settings } from 'luxon';

// Configure Luxon to use UTC as default
Settings.defaultZone = 'utc';

/**
 * Get current UTC timestamp as ISO string
 * Use this for database createdAt/updatedAt fields
 */
export const utcNow = (): string => {
  return DateTime.utc().toISO();
};

/**
 * Get current UTC DateTime object
 * Use this when you need a DateTime object for calculations
 */
export const utcNowDateTime = (): DateTime => {
  return DateTime.utc();
};

/**
 * Convert any date to UTC DateTime object
 * @param date - Date string, Date object, or DateTime object
 * @returns DateTime object in UTC
 */
export const toUtc = (date: string | Date | DateTime): DateTime => {
  if (typeof date === 'string') {
    return DateTime.fromISO(date, { zone: 'utc' });
  } else if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: 'utc' });
  } else if (DateTime.isDateTime(date)) {
    return date.toUTC();
  } else {
    throw new Error('Invalid date input');
  }
};

/**
 * Format date for display in user's local timezone
 * @param date - Date string, Date object, or DateTime object
 * @param format - Luxon format string (default: relative time like "2 hours ago")
 * @param timezone - Target timezone (default: user's local timezone)
 * @returns Formatted date string
 */
export const formatForDisplay = (
  date: string | Date | DateTime | null | undefined,
  format: 'relative' | 'short' | 'long' | 'datetime' | 'date' | 'time' | string = 'relative',
  timezone?: string
): string => {
  if (!date) return 'Never';
  
  try {
    let dt = toUtc(date);
    
    // Convert to target timezone if specified, otherwise use local
    if (timezone) {
      dt = dt.setZone(timezone);
    } else {
      dt = dt.setZone('local');
    }
    
    switch (format) {
      case 'relative':
        return dt.toRelative() || 'Unknown';
      case 'short':
        return dt.toFormat('MMM d, h:mm a');
      case 'long':
        return dt.toFormat('MMMM d, yyyy \'at\' h:mm a');
      case 'datetime':
        return dt.toFormat('yyyy-MM-dd HH:mm');
      case 'date':
        return dt.toFormat('MMM d, yyyy');
      case 'time':
        return dt.toFormat('h:mm a');
      default:
        // Custom format string
        return dt.toFormat(format);
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return 'Invalid date';
  }
};

/**
 * Format date specifically for task cards and boards
 * Shows relative time if recent, otherwise shows short format
 */
export const formatForTaskCard = (date: string | Date | DateTime | null | undefined): string => {
  if (!date) return 'Never';
  
  try {
    const dt = toUtc(date).setZone('local');
    const now = DateTime.local();
    const diff = now.diff(dt, 'days').days;
    
    // If less than 7 days, show relative time
    if (diff < 7) {
      return dt.toRelative() || 'Recently';
    } else {
      // Otherwise show short format
      return dt.toFormat('MMM d, h:mm a');
    }
  } catch (error) {
    console.error('Error formatting task card date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date for task detail modal
 * Shows full date with time
 */
export const formatForTaskDetail = (date: string | Date | DateTime | null | undefined): string => {
  if (!date) return 'Not set';
  
  try {
    const dt = toUtc(date).setZone('local');
    return dt.toFormat('MMMM d, yyyy \'at\' h:mm a');
  } catch (error) {
    console.error('Error formatting task detail date:', error);
    return 'Invalid date';
  }
};

/**
 * Format due date with context (overdue, today, tomorrow, etc.)
 */
export const formatDueDate = (dueDate: string | Date | DateTime | null | undefined): {
  formatted: string;
  status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';
  className: string;
} => {
  if (!dueDate) {
    return {
      formatted: 'No due date',
      status: 'none',
      className: 'text-gray-500'
    };
  }
  
  try {
    const dt = toUtc(dueDate).setZone('local');
    const now = DateTime.local();
    const startOfToday = now.startOf('day');
    const startOfDueDate = dt.startOf('day');
    
    const daysDiff = startOfDueDate.diff(startOfToday, 'days').days;
    
    if (daysDiff < 0) {
      // Overdue
      return {
        formatted: `Due ${dt.toRelative()}`,
        status: 'overdue',
        className: 'text-red-600 dark:text-red-400'
      };
    } else if (daysDiff === 0) {
      // Today
      return {
        formatted: `Due today at ${dt.toFormat('h:mm a')}`,
        status: 'today',
        className: 'text-orange-600 dark:text-orange-400'
      };
    } else if (daysDiff === 1) {
      // Tomorrow
      return {
        formatted: `Due tomorrow at ${dt.toFormat('h:mm a')}`,
        status: 'tomorrow',
        className: 'text-yellow-600 dark:text-yellow-400'
      };
    } else {
      // Upcoming
      return {
        formatted: `Due ${dt.toFormat('MMM d \'at\' h:mm a')}`,
        status: 'upcoming',
        className: 'text-blue-600 dark:text-blue-400'
      };
    }
  } catch (error) {
    console.error('Error formatting due date:', error);
    return {
      formatted: 'Invalid date',
      status: 'none',
      className: 'text-gray-500'
    };
  }
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dueDate: string | Date | DateTime | null | undefined): boolean => {
  if (!dueDate) return false;
  
  try {
    const dt = toUtc(dueDate);
    const now = DateTime.utc();
    return dt < now;
  } catch (error) {
    return false;
  }
};

/**
 * Parse user input date string to UTC DateTime
 * Useful for form inputs
 */
export const parseUserDate = (dateString: string, timezone?: string): DateTime | null => {
  if (!dateString) return null;
  
  try {
    // If timezone specified, parse in that timezone then convert to UTC
    if (timezone) {
      const dt = DateTime.fromISO(dateString, { zone: timezone });
      return dt.isValid ? dt.toUTC() : null;
    } else {
      // Parse as local time then convert to UTC
      const dt = DateTime.fromISO(dateString);
      return dt.isValid ? dt.toUTC() : null;
    }
  } catch (error) {
    console.error('Error parsing user date:', error);
    return null;
  }
};

/**
 * Convert UTC date to user's local timezone for form inputs
 * Returns YYYY-MM-DDTHH:mm format for HTML datetime-local inputs
 */
export const toLocalDateTimeString = (date: string | Date | DateTime | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dt = toUtc(date).setZone('local');
    return dt.toFormat("yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error converting to local datetime string:', error);
    return '';
  }
};

/**
 * Get timezone-aware current date for database operations
 * Always returns UTC ISO string for consistency
 */
export const getDbTimestamp = (): string => {
  return DateTime.utc().toISO();
};

/**
 * Format timestamp for content submission with timezone context
 */
export const formatContentSubmissionDate = (
  date: string | Date | DateTime | null | undefined,
  timezone?: string
): string => {
  if (!date) return 'Not set';
  
  try {
    let dt = toUtc(date);
    
    if (timezone) {
      // If timezone provided, show in that timezone
      dt = dt.setZone(timezone);
      return `${dt.toFormat('MMM d, yyyy \'at\' h:mm a')} ${timezone}`;
    } else {
      // Show in local timezone
      dt = dt.setZone('local');
      return dt.toFormat('MMM d, yyyy \'at\' h:mm a');
    }
  } catch (error) {
    console.error('Error formatting content submission date:', error);
    return 'Invalid date';
  }
};

/**
 * Date utility functions
 * 
 * Handles timezone-aware date parsing and formatting
 * Backend returns naive datetime (UTC) without timezone info
 */

/**
 * Parse a datetime string, handling UTC timezone correctly
 * If the string doesn't have a timezone indicator, treat it as UTC
 */
export function parseUTCDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  // Check if string has timezone indicator (Z, +HH:MM, or -HH:MM after position 10)
  const hasTimezone = dateString.includes('Z') || 
    (dateString.includes('+') && dateString.length > 19) ||
    (dateString.lastIndexOf('-') > 10); // Timezone offset like -05:00
  
  return hasTimezone
    ? new Date(dateString)
    : new Date(dateString + 'Z'); // Append 'Z' to treat as UTC
}

/**
 * Format last studied time as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatLastStudied(dateString?: string | null): string {
  if (!dateString) return "Not studied yet";
  
  const date = parseUTCDate(dateString);
  if (!date) return "Not studied yet";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Format last studied time with full text (e.g., "2 minutes ago", "3 days ago")
 */
export function formatLastStudiedFull(dateString?: string | null): string {
  if (!dateString) return "Not started";
  
  const date = parseUTCDate(dateString);
  if (!date) return "Not started";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

/**
 * Format date to locale date string
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  
  const date = parseUTCDate(dateString);
  if (!date) return "N/A";
  
  return date.toLocaleDateString();
}

/**
 * Format date and time to locale string
 */
export function formatDateTime(
  dateString?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "N/A";
  
  const date = parseUTCDate(dateString);
  if (!date) return "N/A";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  return date.toLocaleString('vi-VN', options || defaultOptions);
}

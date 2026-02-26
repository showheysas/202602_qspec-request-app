/**
 * Calculates the number of business days between two dates
 * Business days exclude Saturdays and Sundays (Japanese business days)
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  // Ensure endDate is after startDate
  if (endDate < startDate) {
    return 0;
  }

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Checks if the deadline is within the warning threshold (less than 5 business days)
 */
export function isDeadlineWarning(submissionDeadline: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Include today in the count
  const businessDays = calculateBusinessDays(today, submissionDeadline);

  return businessDays < 5;
}

/**
 * Formats a date to Japanese date string (YYYY年MM月DD日)
 */
export function formatJapaneseDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

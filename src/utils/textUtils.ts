/**
 * Text utility functions for formatting and manipulating text
 */

/**
 * Formats a date string to a more readable format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Find the last space within the maxLength to avoid cutting words
  const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
  const truncated = lastSpace > 0 
    ? text.substring(0, lastSpace) 
    : text.substring(0, maxLength);
    
  return `${truncated}...`;
}; 
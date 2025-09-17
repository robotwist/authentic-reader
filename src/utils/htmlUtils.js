/**
 * HTML sanitization and rendering utilities
 * Handles cleaning HTML content for safe display
 */
/**
 * Sanitizes HTML content by removing potentially harmful tags and attributes
 * @param html The raw HTML string to sanitize
 * @returns Cleaned HTML string safe for rendering
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    // Remove script tags and their contents
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove style tags and their contents
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Remove iframe, object, embed tags
    sanitized = sanitized.replace(/<(iframe|object|embed|frame|frameset)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Remove potentially harmful attributes
    const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
    dangerousAttrs.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(regex, '');
    });
    // Remove javascript: URLs
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
    return sanitized;
}
/**
 * Converts HTML to plain text by stripping all HTML tags
 * @param html The HTML string to convert
 * @returns Plain text without HTML tags
 */
export function htmlToText(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}
/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) { // If we can find a space in the last 20%
        return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
}
/**
 * Processes article description for display
 * @param description The raw description (may contain HTML)
 * @param maxLength Maximum length for truncation
 * @returns Object with both HTML and text versions
 */
export function processArticleDescription(description, maxLength = 200) {
    if (!description) {
        return {
            html: '',
            text: 'No description available',
            truncated: 'No description available'
        };
    }
    // Sanitize the HTML
    const sanitizedHtml = sanitizeHtml(description);
    // Convert to plain text
    const plainText = htmlToText(description);
    // Truncate the text version
    const truncatedText = truncateText(plainText, maxLength);
    return {
        html: sanitizedHtml,
        text: plainText,
        truncated: truncatedText
    };
}
/**
 * Checks if a string contains HTML tags
 * @param text The text to check
 * @returns True if the text contains HTML tags
 */
export function containsHtml(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    // Simple check for HTML tags
    return /<[^>]*>/g.test(text);
}
/**
 * Extracts text content from HTML for preview purposes
 * @param html The HTML content
 * @param maxLength Maximum length for the preview
 * @returns Plain text preview
 */
export function extractTextPreview(html, maxLength = 150) {
    const text = htmlToText(html);
    return truncateText(text, maxLength);
}

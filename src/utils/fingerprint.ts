/**
 * Browser fingerprinting utility for anonymous user identification
 * Creates a simple fingerprint based on browser characteristics
 */

const FINGERPRINT_KEY = 'user_fingerprint';

/**
 * Generate a simple browser fingerprint
 * Uses a combination of screen resolution, timezone, language, and user agent
 */
function generateFingerprint(): string {
  const components = [
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.language,
    navigator.userAgent,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}`;
}

/**
 * Get or create a user fingerprint
 * Stores the fingerprint in localStorage for persistence
 */
export function getUserFingerprint(): string {
  try {
    // Try to get existing fingerprint from localStorage
    const stored = localStorage.getItem(FINGERPRINT_KEY);
    if (stored) {
      return stored;
    }

    // Generate new fingerprint
    const fingerprint = generateFingerprint();
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
    return fingerprint;
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('Could not access localStorage, using session fingerprint');
    return generateFingerprint();
  }
}

/**
 * Clear the stored fingerprint (useful for testing)
 */
export function clearFingerprint(): void {
  try {
    localStorage.removeItem(FINGERPRINT_KEY);
  } catch (error) {
    console.warn('Could not clear fingerprint from localStorage');
  }
}


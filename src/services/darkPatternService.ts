/**
 * Dark Pattern Detection Service
 * 
 * This service analyzes websites for common dark patterns - manipulative UI/UX
 * design techniques that deceive or manipulate users into making certain choices.
 */

import { DarkPatternType, DarkPatternDetection } from '../types';
import { logger } from '../utils/logger';

// Regular expressions for detecting different dark patterns
const DARK_PATTERN_REGEXES = {
  // Countdown timers and false urgency
  URGENCY: {
    patterns: [
      /limited\s+time/i,
      /\d+\s*(minutes|mins|seconds|hours|days)\s+left/i,
      /hurry\s+up/i,
      /act\s+now/i,
      /offer\s+expires/i,
      /only\s+\d+\s+left/i,
      /stock\s+running\s+low/i,
      /selling\s+fast/i,
      /ends\s+soon/i,
      /don't\s+miss\s+out/i,
      /while\s+supplies\s+last/i
    ],
    selectors: [
      '.countdown',
      '.timer',
      '.limited-time',
      '.urgency',
      '[class*="countdown"]',
      '[class*="timer"]',
      '[id*="countdown"]'
    ]
  },
  
  // Forced continuity (auto-renewals hidden in terms)
  FORCED_CONTINUITY: {
    patterns: [
      /auto.?renewal/i,
      /automatically\s+renew/i,
      /automatically\s+charged/i,
      /subscription\s+will\s+renew/i,
      /cancel\s+anytime/i,
      /you\s+will\s+be\s+charged/i,
      /continue\s+at\s+regular\s+price/i
    ],
    selectors: [
      '.subscription-terms',
      '.terms-text',
      '.renewal-terms',
      '.auto-renewal',
      '[class*="subscription"]',
      'form small'
    ]
  },
  
  // Misdirection and hidden information
  MISDIRECTION: {
    patterns: [
      /by\s+clicking\s+you\s+agree/i,
      /opt\s+out/i,
      /uncheck\s+if\s+you\s+do\s+not/i,
      /we\s+may\s+use\s+your\s+email/i,
      /we\s+may\s+share\s+your\s+data/i
    ],
    selectors: [
      'input[type="checkbox"]:checked',
      '.terms-checkbox',
      '.consent-checkbox',
      '.newsletter-checkbox',
      '[class*="opt-out"]'
    ]
  },
  
  // Disguised ads
  DISGUISED_ADS: {
    patterns: [
      /sponsored/i,
      /advertisement/i,
      /promoted/i,
      /recommended\s+for\s+you/i,
      /suggested\s+for\s+you/i,
      /you\s+may\s+also\s+like/i
    ],
    selectors: [
      '[class*="sponsored"]',
      '[class*="ad-"]',
      '[class*="-ad"]',
      '[class*="promotion"]',
      '[id*="banner"]',
      '.recommendation-widget',
      '.sponsored-content',
      '.native-ad'
    ]
  },
  
  // Confirmshaming (guilt trips for declining)
  CONFIRMSHAMING: {
    patterns: [
      /no\s+thanks\s*,\s*i\s+don't\s+want/i,
      /no\s*,\s*i\s+don't\s+want\s+to\s+save/i,
      /i\s+don't\s+want\s+to\s+improve/i,
      /no\s*,\s*i\s+prefer\s+to\s+pay\s+full\s+price/i,
      /no\s*,\s*i\s+don't\s+want\s+to\s+stay\s+informed/i,
      /i\s+don't\s+care\s+about/i,
      /i'll\s+lose\s+out/i
    ],
    selectors: [
      '.popup-decline',
      '.modal-reject',
      '[class*="decline"]',
      '[class*="reject"]',
      '[class*="cancel"]',
      '.btn-secondary',
      '[class*="dismiss"]'
    ]
  },
  
  // Hidden costs and price obscuring
  HIDDEN_COSTS: {
    patterns: [
      /additional\s+fees\s+may\s+apply/i,
      /shipping\s+and\s+handling/i,
      /\+\s*tax/i,
      /plus\s+tax/i,
      /excluding\s+tax/i,
      /service\s+fee/i,
      /processing\s+fee/i,
      /starting\s+at/i,
      /from\s+just/i
    ],
    selectors: [
      '.price-disclaimer',
      '.price-note',
      '.additional-fee',
      '.tax-note',
      '[class*="fee"]',
      '.small-print',
      '.terms-price'
    ]
  },
  
  // Forced account creation
  FORCED_ACCOUNT: {
    patterns: [
      /create\s+an\s+account\s+to\s+continue/i,
      /sign\s+up\s+to\s+continue/i,
      /register\s+to\s+continue/i,
      /login\s+to\s+view/i,
      /create\s+a\s+free\s+account/i
    ],
    selectors: [
      '.login-wall',
      '.signup-wall',
      '.registration-required',
      '.account-required',
      '[class*="paywall"]',
      '[class*="wall"]'
    ]
  },
  
  // Privacy zuckering (confusing privacy controls)
  PRIVACY_ZUCKERING: {
    patterns: [
      /customize\s+your\s+privacy\s+settings/i,
      /manage\s+your\s+privacy\s+preferences/i,
      /we\s+value\s+your\s+privacy/i,
      /cookie\s+preferences/i,
      /please\s+accept\s+all\s+cookies/i
    ],
    selectors: [
      '.cookie-banner',
      '.privacy-banner',
      '.gdpr-notice',
      '.consent-banner',
      '[class*="cookie"]',
      '[class*="privacy"]',
      '[class*="consent"]'
    ]
  },
  
  // Friend spam (contact access)
  FRIEND_SPAM: {
    patterns: [
      /find\s+friends/i,
      /invite\s+your\s+friends/i,
      /connect\s+your\s+contacts/i,
      /see\s+who\s+you\s+know/i,
      /share\s+with\s+friends/i
    ],
    selectors: [
      '.contact-import',
      '.friend-finder',
      '.invite-friends',
      '[class*="contact-import"]',
      '[class*="friend-finder"]',
      '[class*="invite"]'
    ]
  },
  
  // Trick questions (confusing double negatives)
  TRICK_QUESTIONS: {
    patterns: [
      /don't\s+not\s+send\s+me/i,
      /uncheck\s+to\s+opt\s+out/i,
      /check\s+this\s+box\s+if\s+you\s+do\s+not/i,
      /exclude\s+me\s+from/i,
      /do\s+not\s+uncheck/i
    ],
    selectors: [
      '.consent-option',
      '.preference-option',
      '[class*="opt-out"]',
      '[class*="opt-in"]',
      '.checkbox-group'
    ]
  }
};

/**
 * Analyze HTML for dark patterns in text content
 */
const analyzeTextContent = (html: string): DarkPatternDetection[] => {
  const detections: DarkPatternDetection[] = [];
  
  try {
    // Simple text-based analysis for each pattern type
    Object.entries(DARK_PATTERN_REGEXES).forEach(([patternType, data]) => {
      const patterns = data.patterns;
      
      patterns.forEach(pattern => {
        const matches = html.match(pattern);
        
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            // Find the context (surrounding text)
            const matchIndex = html.indexOf(match);
            const startContext = Math.max(0, matchIndex - 50);
            const endContext = Math.min(html.length, matchIndex + match.length + 50);
            const context = html.substring(startContext, endContext).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            detections.push({
              type: patternType as DarkPatternType,
              confidence: 0.75, // Basic pattern match has decent confidence
              description: `Found pattern "${match}" in text`,
              elementType: 'text',
              location: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
              }
            });
          });
        }
      });
    });
  } catch (error) {
    logger.error('Error analyzing text for dark patterns:', error);
  }
  
  return detections;
};

/**
 * Analyze DOM structure for dark patterns using a lightweight approach
 * This is a simplified version that doesn't rely on external DOM libraries
 */
const analyzeDomStructure = (html: string): DarkPatternDetection[] => {
  const detections: DarkPatternDetection[] = [];
  
  // Simple pattern matching for selectors instead of full DOM parsing
  try {
    Object.entries(DARK_PATTERN_REGEXES).forEach(([patternType, data]) => {
      const selectors = data.selectors;
      
      selectors.forEach(selector => {
        try {
          // Simplified selector matching for common patterns
          if (selector.startsWith('.')) {
            // Class selector
            const className = selector.substring(1);
            const classRegex = new RegExp(`class=["'][^"']*${className}[^"']*["']`, 'gi');
            const matches = html.match(classRegex);
            
            if (matches && matches.length > 0) {
              detections.push({
                type: patternType as DarkPatternType,
                confidence: 0.8,
                description: `Found UI element with class ${className}`,
                elementType: 'class',
                location: {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0
                }
              });
            }
          } else if (selector.startsWith('#')) {
            // ID selector
            const id = selector.substring(1);
            const idRegex = new RegExp(`id=["']${id}["']`, 'gi');
            const matches = html.match(idRegex);
            
            if (matches && matches.length > 0) {
              detections.push({
                type: patternType as DarkPatternType,
                confidence: 0.85,
                description: `Found UI element with id ${id}`,
                elementType: 'id',
                location: {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0
                }
              });
            }
          } else if (selector.includes('[') && selector.includes(']')) {
            // Attribute selector (simplified)
            const attrMatch = selector.match(/\[([^\]]+)\]/);
            if (attrMatch) {
              const attr = attrMatch[1].split('=')[0].replace(/\*/g, '');
              const attrRegex = new RegExp(`${attr}=["'][^"']*["']`, 'gi');
              const matches = html.match(attrRegex);
              
              if (matches && matches.length > 0) {
                detections.push({
                  type: patternType as DarkPatternType,
                  confidence: 0.75,
                  description: `Found UI element with attribute ${attr}`,
                  elementType: 'attribute',
                  location: {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                  }
                });
              }
            }
          } else {
            // Tag selector
            const tagRegex = new RegExp(`<${selector}[\\s>]`, 'gi');
            const matches = html.match(tagRegex);
            
            if (matches && matches.length > 0) {
              detections.push({
                type: patternType as DarkPatternType,
                confidence: 0.7,
                description: `Found ${selector} element`,
                elementType: 'tag',
                location: {
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0
                }
              });
            }
          }
        } catch (error) {
          // Silently fail for individual selectors
          logger.debug(`Error with selector ${selector}:`, error);
        }
      });
    });
  } catch (error) {
    logger.error('Error analyzing DOM for dark patterns:', error);
  }
  
  return detections;
};

/**
 * Detect dark patterns in a webpage
 * @param html Raw HTML content of the webpage
 * @returns Array of detected dark patterns
 */
export const detectDarkPatterns = (html: string): DarkPatternDetection[] => {
  try {
    // Combine the results from text and DOM analysis
    const textPatterns = analyzeTextContent(html);
    const domPatterns = analyzeDomStructure(html);
    
    // Combine and deduplicate
    const allPatterns = [...textPatterns, ...domPatterns];
    const deduplicatedPatterns = deduplicateDetections(allPatterns);
    
    // Sort by confidence
    return deduplicatedPatterns.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    logger.error('Error detecting dark patterns:', error);
    return [];
  }
};

/**
 * Remove duplicate detections of the same dark pattern
 */
const deduplicateDetections = (detections: DarkPatternDetection[]): DarkPatternDetection[] => {
  const uniqueDetections: DarkPatternDetection[] = [];
  const seenTypes = new Set<string>();
  
  for (const detection of detections) {
    // Create a unique key based on type and description
    const key = `${detection.type}:${detection.description}`;
    
    if (!seenTypes.has(key)) {
      seenTypes.add(key);
      uniqueDetections.push(detection);
    }
  }
  
  return uniqueDetections;
};

/**
 * Generate a summary of dark pattern detections
 */
export const summarizeDarkPatterns = (detections: DarkPatternDetection[]): string => {
  if (detections.length === 0) {
    return 'No dark patterns detected.';
  }
  
  // Group by type
  const byType: Record<string, DarkPatternDetection[]> = {};
  detections.forEach(detection => {
    if (!byType[detection.type]) {
      byType[detection.type] = [];
    }
    byType[detection.type].push(detection);
  });
  
  // Generate summary
  let summary = `Found ${detections.length} potential dark patterns:\n\n`;
  
  Object.entries(byType).forEach(([type, patterns]) => {
    summary += `- ${type} (${patterns.length} instances): `;
    summary += getPatternDescription(type as DarkPatternType);
    summary += '\n';
    
    // Add examples for clarity
    patterns.slice(0, 2).forEach(pattern => {
      summary += `  • ${pattern.description}\n`;
    });
    
    if (patterns.length > 2) {
      summary += `  • And ${patterns.length - 2} more...\n`;
    }
    
    summary += '\n';
  });
  
  return summary;
};

/**
 * Get a description for each dark pattern type
 */
const getPatternDescription = (type: DarkPatternType): string => {
  switch (type) {
    case DarkPatternType.URGENCY:
      return 'Creates a false sense of urgency or scarcity to rush decisions.';
    case DarkPatternType.FORCED_CONTINUITY:
      return 'Automatically charges users after free trials without clear notice.';
    case DarkPatternType.MISDIRECTION:
      return 'Directs attention away from important information or choices.';
    case DarkPatternType.DISGUISED_ADS:
      return 'Presents ads as content or navigation to increase click-through rates.';
    case DarkPatternType.CONFIRMSHAMING:
      return 'Uses guilt or shame to influence users to opt into something.';
    case DarkPatternType.HIDDEN_COSTS:
      return 'Reveals additional fees or charges only at the end of a purchase flow.';
    case DarkPatternType.FORCED_ACCOUNT:
      return 'Requires account creation to access content or complete actions.';
    case DarkPatternType.PRIVACY_ZUCKERING:
      return 'Makes privacy settings confusing or difficult to control.';
    case DarkPatternType.FRIEND_SPAM:
      return 'Tricks users into sharing content with their contacts.';
    case DarkPatternType.TRICK_QUESTIONS:
      return 'Uses confusing language or double negatives to mislead users.';
    default:
      return 'A manipulative design pattern that can deceive users.';
  }
}; 
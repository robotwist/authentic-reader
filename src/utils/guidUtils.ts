import { GUID } from '../types';

/**
 * Helper functions for working with article GUIDs which can be either strings or objects
 */

/**
 * Type guard to check if a value is a GUID object (having a _ property)
 * @param guid The potential GUID object to check
 * @returns True if the value is a GUID object with _ property
 */
export function isGuidObject(guid: any): guid is { _: string; type?: string } {
  return typeof guid === 'object' && 
         guid !== null && 
         typeof guid._ === 'string';
}

/**
 * Compares a guid from an article with a string guid to check for equality
 * Handles the case where guid is an object with a _ property
 * 
 * @param articleGuid The GUID from an article (can be string, object, or undefined)
 * @param guidToCompare The string GUID to compare against
 * @returns boolean indicating if the GUIDs match
 */
export function compareGuids(articleGuid: GUID, guidToCompare: string): boolean {
  try {
    if (!articleGuid || !guidToCompare) return false;
    
    // For debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('compareGuids', { 
        articleGuid, 
        guidToCompare, 
        type: typeof articleGuid 
      });
    }
    
    // If guid is a string, do direct comparison
    if (typeof articleGuid === 'string') {
      return articleGuid === guidToCompare;
    } 
    
    // If guid is an object with _ property
    if (isGuidObject(articleGuid)) {
      return articleGuid._ === guidToCompare;
    }
    
    // If guid is an object but doesn't have a standard structure
    if (typeof articleGuid === 'object' && articleGuid !== null) {
      // Check all string properties for a match
      for (const key in articleGuid) {
        if (typeof articleGuid[key] === 'string' && articleGuid[key] === guidToCompare) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in compareGuids:', error);
    return false;
  }
}

/**
 * Extracts a string value from a guid which might be an object
 * 
 * @param guid The GUID to extract a string from (can be string, object with _ property, or undefined)
 * @returns The extracted string or an empty string if unable to extract
 */
export function extractGuidString(guid: GUID): string {
  try {
    if (!guid) return '';
    
    // For debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('extractGuidString', { 
        guid, 
        type: typeof guid 
      });
    }
    
    // If guid is already a string, return it
    if (typeof guid === 'string') {
      return guid;
    }
    
    // If guid is an object with _ property (standard RSS format)
    if (isGuidObject(guid)) {
      return guid._;
    }
    
    // If guid is an object but doesn't have the standard structure
    if (typeof guid === 'object' && guid !== null) {
      // Try to find any string property to use
      for (const key in guid) {
        if (typeof guid[key] === 'string') {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Found alternative guid property: ${key}`);
          }
          return guid[key];
        }
      }
      
      // Last resort: stringify the object
      try {
        return JSON.stringify(guid);
      } catch {
        console.warn('Failed to stringify guid object');
      }
    }
    
    console.warn('Could not extract string from guid:', guid);
    return '';
  } catch (error) {
    console.error('Error in extractGuidString:', error);
    return '';
  }
}

/**
 * Creates a reliable string key from a GUID or falls back to link or a random value
 * Useful for React key props
 * 
 * @param guid The GUID to convert to a key
 * @param link Fallback link if GUID is not available
 * @returns A string that can be used as a React key
 */
export function createKeyFromGuid(guid: GUID, link?: string): string {
  const guidString = extractGuidString(guid);
  
  if (guidString) return guidString;
  if (link) return link;
  
  // Last resort: create a random key
  return `article-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
} 
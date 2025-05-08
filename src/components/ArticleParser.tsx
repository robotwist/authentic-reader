import React, { useState, useEffect } from 'react';
import { Readability } from '@mozilla/readability';
import { logger } from '../utils/logger';
import { ExtractedContent, ArticlePassage } from '../types';
import { saveExtractedContent } from '../services/storageService';

interface ArticleParserProps {
  url: string;
  htmlContent?: string;
  onParsed: (content: ExtractedContent, passages: ArticlePassage[]) => void;
  onError: (error: string) => void;
}

/**
 * Basic HTML sanitizer to remove potentially harmful tags and attributes
 * This is a simplified version, not as comprehensive as DOMPurify
 */
const sanitizeHtml = (html: string): string => {
  // Remove script tags and contents
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove inline event handlers
  sanitized = sanitized.replace(/\s(on\w+)="[^"]*"/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|frame|frameset)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove potentially harmful attributes
  const dangerousAttrs = ['src', 'href', 'xlink:href', 'data'];
  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'](javascript|data|vbscript):[^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized;
};

/**
 * Component that handles parsing article content from HTML
 * Uses Readability for content extraction and splits it into passages for analysis
 */
const ArticleParser: React.FC<ArticleParserProps> = ({ 
  url, 
  htmlContent, 
  onParsed, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseArticle = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get HTML content either from props or by fetching
        let html = htmlContent;
        if (!html) {
          try {
            // Use a CORS proxy if available, otherwise attempt direct fetch
            // Note: For production, set up your own proxy or use a service like Cloudflare Workers
            const corsProxy = import.meta.env.VITE_CORS_PROXY || '';
            const targetUrl = corsProxy ? `${corsProxy}${encodeURIComponent(url)}` : url;
            
            const response = await fetch(targetUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch article: ${response.statusText}`);
            }
            html = await response.text();
          } catch (fetchError) {
            logger.error('Error fetching article:', fetchError);
            throw new Error('Could not fetch the article. Please check the URL or try again later.');
          }
        }
        
        // Parse the HTML using Readability
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const reader = new Readability(doc);
        const article = reader.parse();
        
        if (!article) {
          throw new Error('Could not extract article content. The page might not contain a main article.');
        }
        
        // Sanitize the content with our simple sanitizer
        const sanitizedContent = sanitizeHtml(article.content);
        
        // Extract metadata
        const metaTags = Array.from(doc.querySelectorAll('meta')).reduce((acc, meta) => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const content = meta.getAttribute('content');
          if (name && content) {
            acc[name] = content;
          }
          return acc;
        }, {} as Record<string, string>);
        
        // Create the content ID
        const contentId = Date.now().toString();
        
        // Create the extracted content object with the updated structure
        const extractedContent: ExtractedContent = {
          id: contentId,
          content: sanitizedContent,
          metadata: {
            title: article.title || metaTags['og:title'] || 'Untitled Article',
            byline: article.byline || metaTags['author'] || metaTags['og:author'] || '',
            siteName: article.siteName || metaTags['og:site_name'] || new URL(url).hostname,
            date: metaTags['article:published_time'] || '',
            url,
            excerpt: article.excerpt || metaTags['description'] || metaTags['og:description'] || '',
            imageUrl: metaTags['og:image'] || ''
          },
          timestamp: Date.now()
        };
        
        // Split the content into passages for analysis
        const passages = splitIntoPassages(article.textContent || '', contentId);
        
        // Store the extracted content
        await saveExtractedContent(extractedContent);
        
        // Call the callback with the parsed content and passages
        onParsed(extractedContent, passages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        logger.error('Error parsing article:', err);
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    parseArticle();
  }, [url, htmlContent, onParsed, onError]);
  
  // Function to split the text into passages for analysis
  const splitIntoPassages = (text: string, articleId: string): ArticlePassage[] => {
    // Remove extra whitespace and normalize
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    
    // Strategy: Split on paragraph breaks first, then further split large paragraphs
    const paragraphs = normalizedText.split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Ideal passage length (around 2-3 sentences, ~100-150 words)
    const targetLength = 800;
    
    const passages: ArticlePassage[] = [];
    let currentPassage = '';
    let startIndex = 0;
    let passageIndex = 0;
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed target length, save current passage
      if (currentPassage.length > 0 && currentPassage.length + paragraph.length > targetLength) {
        passages.push({
          id: `${articleId}-passage-${passageIndex}`,
          text: currentPassage.trim(),
          startIndex,
          endIndex: startIndex + currentPassage.length,
          analyses: null
        });
        passageIndex++;
        startIndex = startIndex + currentPassage.length;
        currentPassage = '';
      }
      
      // If paragraph itself exceeds target length, split into sentences
      if (paragraph.length > targetLength) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        
        for (const sentence of sentences) {
          if (currentPassage.length + sentence.length > targetLength && currentPassage.length > 0) {
            passages.push({
              id: `${articleId}-passage-${passageIndex}`,
              text: currentPassage.trim(),
              startIndex,
              endIndex: startIndex + currentPassage.length,
              analyses: null
            });
            passageIndex++;
            startIndex = startIndex + currentPassage.length;
            currentPassage = '';
          }
          
          currentPassage += sentence + ' ';
        }
      } else {
        currentPassage += paragraph + ' ';
      }
    }
    
    // Add the last passage if there's anything left
    if (currentPassage.trim().length > 0) {
      passages.push({
        id: `${articleId}-passage-${passageIndex}`,
        text: currentPassage.trim(),
        startIndex,
        endIndex: startIndex + currentPassage.length,
        analyses: null
      });
    }
    
    return passages;
  };
  
  // Simple loading/error UI
  if (isLoading) {
    return <div className="article-parser-loading">Extracting article content...</div>;
  }
  
  if (error) {
    return <div className="article-parser-error">Error: {error}</div>;
  }
  
  // The component doesn't render anything when successful as it just passes data to parent
  return null;
};

export default ArticleParser; 
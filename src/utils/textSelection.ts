/**
 * Utilities for handling text selection and annotation highlighting
 */

export interface SelectionData {
  text: string;
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
  xpath?: string;
  cssPath?: string;
}

/**
 * Gets the current user text selection
 * @returns Selection data or null if no selection
 */
export const getCurrentSelection = (): SelectionData | null => {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const startContainer = getNodePath(range.startContainer);
  const endContainer = getNodePath(range.endContainer);
  
  if (!startContainer || !endContainer) {
    console.error('Unable to determine selection container paths');
    return null;
  }
  
  return {
    text: selection.toString(),
    startContainer,
    startOffset: range.startOffset,
    endContainer,
    endOffset: range.endOffset,
    xpath: getXPath(range.startContainer),
    cssPath: getCssPath(range.startContainer.parentElement)
  };
};

/**
 * Gets a unique path to a node within the document
 * Useful for recreating selections later
 */
export const getNodePath = (node: Node): string => {
  if (!node || !node.parentNode) {
    return '';
  }
  
  let path = '';
  let currentNode: Node | null = node;
  
  while (currentNode && currentNode !== document.body) {
    let currentNodeName = currentNode.nodeName.toLowerCase();
    let parentNode = currentNode.parentNode;
    
    if (!parentNode) break;
    
    // Get index of the node among its siblings
    let siblings = Array.from(parentNode.childNodes);
    let index = siblings.findIndex(sibling => sibling === currentNode);
    
    path = `/${currentNodeName}[${index}]${path}`;
    currentNode = parentNode;
  }
  
  return path || '';
};

/**
 * Gets an XPath for a node
 */
export const getXPath = (node: Node): string => {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  
  const element = node as Element;
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts: string[] = [];
  let current: Node | null = node;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let currentElement = current as Element;
    
    // Get position among siblings
    let siblingsCount = 0;
    let sibling = currentElement.previousElementSibling;
    
    while (sibling) {
      if (sibling.nodeName === currentElement.nodeName) {
        siblingsCount++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const position = siblingsCount === 0 ? '' : `[${siblingsCount + 1}]`;
    parts.push(`${currentElement.nodeName.toLowerCase()}${position}`);
    
    current = currentElement.parentNode;
  }
  
  return `/${parts.reverse().join('/')}`;
};

/**
 * Gets a CSS selector path for the element
 */
export const getCssPath = (element: Element | null): string => {
  if (!element) {
    return '';
  }
  
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.documentElement) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, no need to go further
    } else if (current.className) {
      selector += `.${Array.from(current.classList).join('.')}`;
    }
    
    // Add position if needed
    if (!current.id) {
      let sibling = current.previousElementSibling;
      let position = 1;
      
      while (sibling) {
        if (sibling.nodeName === current.nodeName) {
          position++;
        }
        sibling = sibling.previousElementSibling;
      }
      
      if (position > 1) {
        selector += `:nth-of-type(${position})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
};

/**
 * Applies highlights to an article based on annotation data
 * @param containerElement - The element containing the article content
 * @param annotations - Array of annotations with selection data
 */
export const applyHighlights = (containerElement: HTMLElement, annotations: any[]): void => {
  if (!containerElement || !annotations || annotations.length === 0) {
    return;
  }
  
  // First, remove any existing highlights
  removeHighlights(containerElement);
  
  // Apply each highlight
  annotations.forEach(annotation => {
    if (annotation.type === 'highlight' && annotation.selection) {
      try {
        const { startContainer, startOffset, endContainer, endOffset } = annotation.selection;
        
        // Try to find the nodes using the paths
        const startNode = findNodeByPath(containerElement, startContainer);
        const endNode = findNodeByPath(containerElement, endContainer);
        
        if (startNode && endNode) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          
          highlightRange(range, annotation);
        }
      } catch (error) {
        console.error('Error applying highlight:', error);
      }
    }
  });
};

/**
 * Finds a node using the path created by getNodePath
 */
export const findNodeByPath = (containerElement: HTMLElement, path: string): Node | null => {
  if (!path) return null;
  
  const parts = path.split('/').filter(p => p);
  let currentNode: Node = containerElement;
  
  for (const part of parts) {
    const match = part.match(/([a-z0-9]+)\[(\d+)\]/i);
    if (!match) continue;
    
    const [, nodeName, indexStr] = match;
    const index = parseInt(indexStr, 10);
    
    // Find the child node at the specified index
    let childNodes = Array.from(currentNode.childNodes);
    let matchingNodes = childNodes.filter(node => 
      node.nodeName.toLowerCase() === nodeName.toLowerCase()
    );
    
    if (matchingNodes.length > index) {
      currentNode = matchingNodes[index];
    } else {
      return null; // Node not found
    }
  }
  
  return currentNode;
};

/**
 * Highlights a range of text
 */
export const highlightRange = (range: Range, annotation: any): void => {
  const highlightElement = document.createElement('span');
  highlightElement.className = 'article-highlight';
  highlightElement.dataset.annotationId = annotation.id;
  highlightElement.setAttribute('title', 'Click to view this annotation');
  
  // Add the annotation text as a data attribute
  highlightElement.dataset.annotationText = annotation.text;
  
  // Different colors for different types of highlights
  const colors: Record<string, string> = {
    highlight: 'rgba(255, 235, 59, 0.4)',
    question: 'rgba(33, 150, 243, 0.3)',
    insight: 'rgba(76, 175, 80, 0.3)',
    correction: 'rgba(244, 67, 54, 0.3)'
  };
  
  highlightElement.style.backgroundColor = colors[annotation.type] || colors.highlight;
  
  try {
    range.surroundContents(highlightElement);
  } catch (error) {
    console.error('Error surrounding content with highlight:', error);
    
    // Fallback: Try to insert the highlight node in pieces
    const fragment = range.extractContents();
    highlightElement.appendChild(fragment);
    range.insertNode(highlightElement);
  }
};

/**
 * Removes all highlights from a container element
 */
export const removeHighlights = (containerElement: HTMLElement): void => {
  const highlights = containerElement.querySelectorAll('.article-highlight');
  
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      // Move all children out of the highlight span
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight);
      }
      // Remove the empty highlight span
      parent.removeChild(highlight);
    }
  });
  
  // Normalize the container to merge adjacent text nodes
  containerElement.normalize();
};

/**
 * Add click event listeners to all highlights in a container
 * @param containerElement - The element containing the highlights
 * @param onHighlightClick - Callback function when a highlight is clicked
 */
export const setupHighlightListeners = (
  containerElement: HTMLElement,
  onHighlightClick: (annotationId: string) => void
): void => {
  containerElement.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('article-highlight')) {
      const annotationId = target.dataset.annotationId;
      if (annotationId) {
        onHighlightClick(annotationId);
      }
    }
  });
}; 
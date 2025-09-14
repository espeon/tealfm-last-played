/**
 * Detects if the current page is running inside an iframe
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
}

/**
 * Gets iframe dimensions if available
 */
export function getIframeDimensions(): { width: number; height: number } | null {
  if (typeof window === 'undefined' || !isInIframe()) return null;

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Checks if the embed should use compact mode based on size
 */
export function shouldUseCompactMode(): boolean {
  const dimensions = getIframeDimensions();
  if (!dimensions) return false;

  // Use compact mode for small embeds
  return dimensions.width < 600 || dimensions.height < 400;
}

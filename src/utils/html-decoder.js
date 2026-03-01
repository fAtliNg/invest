
/**
 * Decodes HTML entities in a string.
 * Safe to use with React's default text rendering as React will escape any resulting HTML tags.
 * 
 * @param {string} text - The text containing HTML entities
 * @returns {string} - The decoded text
 */
export function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');
}

/**
 * Extracts the ID from a slugged ID string (e.g., "my-kos-name--123" -> "123")
 * We use double dash as a separator to safely distinguish from UUID dashes.
 */
export function extractIdFromSlug(sluggedId: string): string {
  if (!sluggedId) return "";
  
  // If it contains a double dash, extract what follows it
  if (sluggedId.includes('--')) {
    const parts = sluggedId.split('--');
    return parts[parts.length - 1];
  }
  
  // If no double dash, but it's a UUID, return it
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = sluggedId.match(uuidRegex);
  if (match) return match[0];

  // Fallback to simple split if it's just a number
  return sluggedId;
}

/**
 * Generates a Shopee-style slug path
 * Format: /type/name-slug--id
 */
export function generateProductPath(type: 'kos' | 'item', title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]/g, '')         // Remove non-word characters
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .trim();                        // Trim spaces

  // Use double dash as separator for better ID extraction
  return `/${type}/${slug}--${id}`;
}

/**
 * Generates a Shopee-style slug link (Full URL for WhatsApp/Sharing)
 * Format: https://website.id/type/name-slug--id
 */
export function generateProductLink(type: 'kos' | 'item', title: string, id: string): string {
  const websiteName = "https://KosKita.id";
  return `${websiteName}${generateProductPath(type, title, id)}`;
}

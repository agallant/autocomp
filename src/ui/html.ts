/** Escape text for HTML body content. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Escape text for HTML attribute values. */
export function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;')
}

/**
 * Generate a UUID v4.
 *
 * Falls back to a Math.random-based implementation when crypto.randomUUID is
 * unavailable. crypto.randomUUID only exists in a secure context (HTTPS or
 * localhost), so testing over plain HTTP — e.g. on a phone via a LAN IP —
 * would otherwise throw and silently break photo capture.
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

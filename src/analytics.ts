// Thin wrapper around the GA4 gtag() function loaded in index.html.
// It no-ops when gtag is unavailable (ad blockers, offline, tests) so
// analytics can never break the game.

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void

export function track(eventName: string, params?: Record<string, unknown>): void {
  try {
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag
    if (typeof gtag === 'function') {
      gtag('event', eventName, params)
    }
  } catch {
    // Never let analytics errors affect gameplay.
  }
}

// Minimal service worker — its only job is to make the app installable on phones
// ("Add to Home Screen" / "Install app"). It deliberately does no caching: this app's
// data must always come fresh from Supabase, so an offline cache would just show staff
// stale schedules.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {
  // Passthrough — required for install eligibility, but we never intercept a response.
})

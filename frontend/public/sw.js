// Minimal PWA service worker.
// Does not cache clinical data, authenticated responses, Supabase, patients, records, or APIs.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

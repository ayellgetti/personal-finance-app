// The product app used to be served on this origin and registered a service
// worker here. Browsers keep that worker, and the cached shell, until a
// script at /sw.js replaces it. This one drops those caches, takes control
// of open tabs, reloads them from the network, and only then uninstalls.
// Unregistering before the reload leaves the previous worker in control, so
// a container restart still shows the old site.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url))))
      .then(() => self.registration.unregister()),
  );
});

// public/sw.js
self.addEventListener("install", (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener("push", (event) => {
    let data = {
      title: "Rust voorbij ⚡️",
      body: "Tijd voor je volgende set!",
      url: "/workout/active",
    };
  
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        data.body = event.data.text();
      }
    }
  
    const options = {
      body: data.body || "Tijd voor de volgende set!",
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [300, 150, 300],
      data: {
        url: data.url || "/workout/active",
      },
    };
  
    event.waitUntil(self.registration.showNotification(data.title, options));
  });
  
  // Zorg dat aantikken van de notificatie betrouwbaar de actieve sessie opent
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    const targetUrl = event.notification.data?.url || "/workout/active";
  
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // 1. Zoek naar een bestaand venster/tab van de app
          for (const client of clientList) {
            if ("focus" in client) {
              // Navigeer het geopende venster direct naar de juiste URL en focus
              if ("navigate" in client) {
                client.navigate(targetUrl);
              }
              return client.focus();
            }
          }
          // 2. Geen bestaand venster gevonden: open een nieuw PWA window
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  });
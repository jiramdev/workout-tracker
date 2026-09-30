// public/sw.js
self.addEventListener("install", (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  // Luister naar server-push
  self.addEventListener("push", (event) => {
    let data = { title: "Rust voorbij ⚡️", body: "Tijd voor je volgende set!" };
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
  
  // Luister naar lokaal bericht vanuit de timer
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "TRIGGER_REST_NOTIFICATION") {
      const { exerciseName } = event.data;
      self.registration.showNotification("Rust voorbij ⚡️", {
        body: `Tijd voor je volgende set van ${exerciseName || "je oefening"}!`,
        icon: "/icon.png",
        badge: "/icon.png",
        vibrate: [300, 150, 300],
        data: { url: "/workout/active" },
      });
    }
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/workout/active") && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/workout/active");
        }
      })
    );
  });
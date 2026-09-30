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
      tag: "rest-over",
      vibrate: [300, 150, 300],
      data: {
        url: data.url || "/workout/active",
      },
    };
  
    event.waitUntil(self.registration.showNotification(data.title, options));
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/workout/active";
  
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              // Als de client al op de active workout pagina staat, alleen focussen (geen reload)
              if (client.url.includes("/workout/active")) {
                return client.focus();
              }
              // Anders naar de actieve pagina navigeren en focussen
              if ("navigate" in client) {
                client.navigate(targetUrl);
              }
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  });
// Handle installation of the service worker
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Ensure the new service worker activates immediately
  });
  
  // Handle activation of the service worker
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim()); // Take control of all clients
  });
  
  // Handle push events (when a notification is received)
  self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    // Configure notification options
    const options = {
      body: data.body,
      icon: '/logo192.png', // Use your app icon
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/gym' // Default to your app path
      }
    };
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Navigate to the appropriate URL when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  });
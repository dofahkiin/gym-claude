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
    console.log('Push notification received', event);
    
    if (!event.data) {
      console.warn('Received push event with no data');
      return;
    }
    
    try {
      const data = event.data.json();
      console.log('Notification data:', data);
      
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
    } catch (error) {
      console.error('Error processing push notification:', error);
    }
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked', event);
    
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
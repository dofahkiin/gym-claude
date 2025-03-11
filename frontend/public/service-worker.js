// Enhanced service-worker.js for more reliable notifications

// Handle installation of the service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  self.skipWaiting(); // Ensure the new service worker activates immediately
});

// Handle activation of the service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
  console.log('[Service Worker] Service Worker activated');
});

// Handle fetch events (network requests)
// This is needed to ensure the service worker stays active
self.addEventListener('fetch', (event) => {
  // No need to modify the request - just need to handle the event
  // This keeps the service worker active
});

// Handle push events (when a notification is received)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification received', event);
  
  if (!event.data) {
    console.warn('[Service Worker] Received push event with no data');
    return;
  }
  
  try {
    let data;
    
    try {
      // Try to parse as JSON first
      data = event.data.json();
    } catch (jsonError) {
      // Fallback to text if not JSON
      const text = event.data.text();
      try {
        // Try parsing the text as JSON
        data = JSON.parse(text);
      } catch (parseError) {
        // If all fails, create a simple object
        data = {
          title: 'GymTracker Notification',
          body: text,
          url: '/gym'
        };
      }
    }
    
    console.log('[Service Worker] Notification data:', data);
    
    // Configure notification options
    const options = {
      body: data.body || 'Time to get back to your workout!',
      icon: '/gym/logo192.png', // Use your app icon
      badge: '/gym/logo192.png',
      vibrate: [100, 50, 100, 50, 100],
      data: {
        url: data.url || '/gym' // Default to your app path
      },
      // Make notification more noticeable
      requireInteraction: true,
      silent: false,
      timestamp: Date.now()
    };
    
    console.log('[Service Worker] Showing notification with options:', options);
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'GymTracker', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push notification:', error);
    
    // Attempt to show a fallback notification
    event.waitUntil(
      self.registration.showNotification('GymTracker', {
        body: 'New notification from GymTracker',
        icon: '/gym/logo192.png',
        requireInteraction: true
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked', event);
  
  event.notification.close();
  
  let targetUrl = '/gym';
  
  // Get the URL from the notification data if available
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  console.log('[Service Worker] Navigating to:', targetUrl);
  
  // Navigate to the appropriate URL when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        // If we find an open window, focus it and navigate if needed
        if ('focus' in client) {
          client.focus();
          
          // If it's not already on the target URL, navigate to it
          if (client.url !== targetUrl && 'navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event);
});

console.log('[Service Worker] Service Worker registered successfully');
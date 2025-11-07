// Enhanced service-worker.js with caching strategies for faster loading

// Cache names
const STATIC_CACHE_NAME = 'gymtracker-static-v1';
const DYNAMIC_CACHE_NAME = 'gymtracker-dynamic-v1';
const VALID_CACHE_NAMES = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

// Resources to cache immediately during installation
const APP_SHELL = [
  '/gym/',
  '/gym/index.html',
  '/gym/static/css/main.chunk.css',
  '/gym/static/js/main.chunk.js',
  '/gym/static/js/bundle.js',
  '/gym/manifest.json',
  '/gym/favicon.ico',
  '/gym/logo192.png',
  '/gym/logo512.png'
];

// Handle installation of the service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Cache app shell resources
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully');
        return self.skipWaiting(); // Ensure the new service worker activates immediately
      })
  );
});

// Handle activation of the service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (!VALID_CACHE_NAMES.includes(key)) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim(); // Take control of all clients immediately
      })
  );
});

// Handle fetch events (network requests)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin && !url.host.includes('localhost')) {
    return;
  }

  // Authenticated API responses contain user-specific data and should never be cached.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For navigation requests, use network-first approach with a quick timeout
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }
  
  // For static assets, use cache-first approach
  event.respondWith(handleStaticRequest(event.request));
});

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // Only cache valid responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If offline and not in cache, return a fallback for image requests
    if (request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      return caches.match('/gym/logo192.png');
    }
    
    // For other resources, just throw the error
    throw error;
  }
}

// Network-first with timeout for navigation requests
async function handleNavigationRequest(request) {
  try {
    // Use a race between network request and timeout
    const networkResponsePromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 1000);
    });
    
    // Try network first, but with a short timeout
    const networkResponse = await Promise.race([
      networkResponsePromise,
      timeoutPromise
    ]);
    
    // Cache the successful response
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, falling back to cache');
    
    // If network fails or times out, try the cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing in cache, try to return the index page
    return caches.match('/gym/index.html');
  }
}

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

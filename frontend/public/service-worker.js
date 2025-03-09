// public/service-worker.js
const CACHE_NAME = 'gym-tracker-v1';

// Assets to cache for offline use
const urlsToCache = [
  '/gym/',
  '/gym/index.html',
  '/gym/static/css/main.chunk.css',
  '/gym/static/js/main.chunk.js',
  '/gym/static/js/bundle.js',
  '/gym/logo192.png',
  '/gym/favicon.ico'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like API calls
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache responses that aren't successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since it can only be used once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// Handle timer messages from the app
const timers = new Map();

self.addEventListener('message', event => {
  console.log('[Service Worker] Received message:', event.data);
  
  if (!event.data) return;
  
  if (event.data.type === 'setTimer') {
    const { exerciseId, duration } = event.data;
    
    // Clear existing timer if any
    if (timers.has(exerciseId)) {
      clearTimeout(timers.get(exerciseId));
    }
    
    // Set a new timer
    const timerId = setTimeout(() => {
      self.registration.showNotification('Rest Timer Complete', {
        body: 'Time to start your next set!',
        icon: '/gym/logo192.png',
        badge: '/gym/logo192.png',
        vibrate: [200, 100, 200],
        tag: 'rest-timer',
        renotify: true,
        data: {
          exerciseId
        }
      });
      
      timers.delete(exerciseId);
    }, duration * 1000);
    
    timers.set(exerciseId, timerId);
    console.log(`[Service Worker] Timer set for exercise ${exerciseId}, ${duration} seconds`);
  }
  
  if (event.data.type === 'clearTimer') {
    const { exerciseId } = event.data;
    
    if (timers.has(exerciseId)) {
      clearTimeout(timers.get(exerciseId));
      timers.delete(exerciseId);
      console.log(`[Service Worker] Timer cleared for exercise ${exerciseId}`);
    }
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received:', event);
  
  let notification = {
    title: 'GymTracker Notification',
    body: 'Something happened in your app.',
    icon: '/gym/logo192.png',
    badge: '/gym/logo192.png'
  };
  
  if (event.data) {
    try {
      notification = JSON.parse(event.data.text());
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/gym/logo192.png',
      badge: notification.badge || '/gym/logo192.png',
      vibrate: [200, 100, 200],
      data: notification.data || {}
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received:', event);
  
  event.notification.close();
  
  // Get data from notification if available
  const exerciseId = event.notification.data && event.notification.data.exerciseId;
  
  // Open a window to the appropriate page in the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If we have a client already open, focus it
        for (const client of clientList) {
          if (exerciseId && client.url.includes(`/workout/`)) {
            return client.navigate(`/gym/workout/${client.url.split('/workout/')[1].split('/')[0]}/exercise/${exerciseId}`)
              .then(client => client.focus());
          }
          
          if (client.url.includes('/gym/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no client is available, open a new one
        if (exerciseId) {
          return clients.openWindow(`/gym/workout/1/exercise/${exerciseId}`);
        }
        return clients.openWindow('/gym/');
      })
  );
});
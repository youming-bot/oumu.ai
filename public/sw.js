const CACHE_NAME = 'shadowing-learning-v3';
const API_CACHE_NAME = 'shadowing-learning-api-v2';
const STATIC_CACHE_NAME = 'shadowing-learning-static-v2';
const AUDIO_CACHE_NAME = 'shadowing-learning-audio-v1';

// URLs to cache for offline functionality
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/offline.html'
];

// API endpoints that can be cached for offline access
const apiEndpointsToCache = [
  '/api/progress/',
  '/api/terms/',
  '/api/transcripts/'
];

// Audio file extensions to handle specially
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      self.skipWaiting()
    ])
  );
});

// Pre-cache important API responses on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(API_CACHE_NAME);

        // Pre-cache essential API endpoints
        const preCachePromises = apiEndpointsToCache.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              await cache.put(endpoint, response.clone());
            }
          } catch (error) {
            console.warn(`Failed to pre-cache ${endpoint}:`, error);
          }
        });

        await Promise.all(preCachePromises);
      } catch (error) {
        console.error('Pre-caching failed:', error);
      }
    })()
  );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests and browser extensions
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle audio files with special caching strategy
  if (isAudioRequest(request)) {
    event.respondWith(cacheFirstWithNetworkFallback(request, AUDIO_CACHE_NAME));
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(request)) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }

  // Default: network first, cache fallback for HTML pages
  event.respondWith(networkFirstWithCacheFallback(request));
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanOldCaches(),
      self.clients.claim()
    ])
  );
});

// Background sync for pending operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

// Helper functions
function isAudioRequest(request) {
  const url = request.url.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => url.includes(ext)) ||
         request.headers.get('Content-Type')?.includes('audio/');
}

function isApiRequest(request) {
  return request.url.includes('/api/') &&
         !request.url.includes('/api/transcribe') &&
         !request.url.includes('/api/postprocess');
}

function isStaticAsset(request) {
  return request.url.includes('/_next/') ||
         request.url.includes('/icon') ||
         request.url.includes('/favicon.ico') ||
         request.url === self.location.origin + '/';
}

async function networkFirstWithCacheFallback(request, cacheName = API_CACHE_NAME) {
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);

    // If successful, cache the response for future offline use
    if (networkResponse.ok && isCacheableRequest(request)) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached response and we're offline, return offline page for HTML requests
    if (!navigator.onLine && request.headers.get('Accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // For API requests, return a proper error response
    if (isApiRequest(request)) {
      return new Response(
        JSON.stringify({
          error: 'Service unavailable offline',
          message: 'Please check your internet connection'
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

async function cacheFirstWithNetworkFallback(request, cacheName = STATIC_CACHE_NAME) {
  try {
    // First try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses for future use
    if (networkResponse.ok && isCacheableRequest(request)) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }

    return networkResponse;
  } catch (error) {
    // For audio files, return a specific error
    if (isAudioRequest(request)) {
      return new Response(
        JSON.stringify({
          error: 'Audio file unavailable offline',
          message: 'This audio file is not cached for offline use'
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response('Network error', {
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}

function isCacheableRequest(request) {
  // Don't cache POST requests or non-GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Don't cache large files or binary data
  const url = request.url.toLowerCase();
  if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg')) {
    return false;
  }

  return true;
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, AUDIO_CACHE_NAME];

  return Promise.all(
    cacheNames.map((cacheName) => {
      if (!currentCaches.includes(cacheName)) {
        console.log('Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

async function doBackgroundSync() {
  // Implement background sync logic here
  // This would sync pending operations when connectivity is restored
  console.log('Background sync started');

  // Example: Sync pending transcriptions or terminology updates
  try {
    // Check if there are any pending operations in IndexedDB
    // and attempt to sync them with the server
    return Promise.resolve('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
    return Promise.reject(error);
  }
}
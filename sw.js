// كلاشي PWA Service Worker
// الإصدار 2.1.0

const CACHE_NAME = 'clashy-v2-1-0';
const OFFLINE_URL = '/offline.html';

// الملفات الأساسية للتخزين المؤقت
const CORE_CACHE_FILES = [
  'https://krarar.github.io/Al-Sabri/',
  'https://krarar.github.io/Al-Sabri/index.html',
  'https://krarar.github.io/Al-Sabri/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://wgvkbrmcgejscgsyapcs.supabase.co/storage/v1/object/public/ghadeer-images/products/1749766675654_4xi0wj.png'
];

// استراتيجية التخزين المؤقت للصور
const IMAGE_CACHE_NAME = 'clashy-images-v1';
const API_CACHE_NAME = 'clashy-api-v1';

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: تثبيت...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('📦 Service Worker: تخزين الملفات الأساسية...');
        await cache.addAll(CORE_CACHE_FILES);
        console.log('✅ Service Worker: تم تخزين الملفات الأساسية');
      } catch (error) {
        console.error('❌ Service Worker: خطأ في التثبيت:', error);
      }
    })()
  );
  
  // فرض التفعيل الفوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: تفعيل...');
  
  event.waitUntil(
    (async () => {
      try {
        // حذف الكاش القديم
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME && cacheName !== API_CACHE_NAME)
          .map(cacheName => {
            console.log('🗑️ Service Worker: حذف كاش قديم:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletionPromises);
        console.log('✅ Service Worker: تم تنظيف الكاش القديم');
        
        // السيطرة على جميع العملاء
        await self.clients.claim();
        console.log('✅ Service Worker: تم السيطرة على جميع العملاء');
      } catch (error) {
        console.error('❌ Service Worker: خطأ في التفعيل:', error);
      }
    })()
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل الطلبات غير HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // استراتيجية مختلفة لكل نوع من الطلبات
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.origin === 'https://wgvkbrmcgejscgsyapcs.supabase.co') {
    event.respondWith(handleAPIRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleResourceRequest(request));
  }
});

// التعامل مع طلبات الصور
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('📷 Service Worker: استخدام صورة افتراضية');
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#8B5CF6"/><text x="100" y="80" text-anchor="middle" fill="white" font-family="Arial" font-size="16">كلاشي</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// التعامل مع طلبات API
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return new Response('{"error": "Network unavailable"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// التعامل مع طلبات التنقل
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('https://krarar.github.io/Al-Sabri/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // صفحة offline بسيطة
    return new Response(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>كلاشي - غير متصل</title>
        <style>
          body {
            font-family: 'Tajawal', sans-serif;
            background: linear-gradient(135deg, #8B5CF6, #06B6D4);
            color: white;
            text-align: center;
            padding: 50px 20px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .offline-container {
            max-width: 400px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .logo {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
          }
          h1 {
            margin-bottom: 20px;
            font-size: 24px;
          }
          p {
            margin-bottom: 30px;
            opacity: 0.9;
            line-height: 1.6;
          }
          .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .retry-btn:hover {
            background: white;
            color: #8B5CF6;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="logo">كلاشي</div>
          <h1>🌐 غير متصل بالإنترنت</h1>
          <p>يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.</p>
          <button class="retry-btn" onclick="window.location.reload()">
            🔄 إعادة المحاولة
          </button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// التعامل مع طلبات الموارد الأخرى
async function handleResourceRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // إرجاع النسخة المخزنة مؤقتاً أولاً
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(() => cachedResponse);
      
      return cachedResponse;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// التعامل مع رسائل العميل
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
      case 'UPDATE_CACHE':
        updateCache().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

// مسح جميع الكاش
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('🗑️ Service Worker: تم مسح جميع الكاش');
}

// تحديث الكاش
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_CACHE_FILES);
    console.log('🔄 Service Worker: تم تحديث الكاش');
  } catch (error) {
    console.error('❌ Service Worker: خطأ في تحديث الكاش:', error);
  }
}

// إرسال إشعار عند توفر تحديث
self.addEventListener('updatefound', () => {
  console.log('🆕 Service Worker: تحديث متاح');
  
  // إرسال رسالة للعميل
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'تحديث جديد متاح لكلاشي'
      });
    });
  });
});

// التعامل مع أخطاء عدم اللحاق
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: خطأ غير معالج:', event.reason);
});

console.log('🎉 Service Worker لكلاشي v2.1.0 جاهز!');

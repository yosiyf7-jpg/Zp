// ==========================================
// Lumi AI - Service Worker
// ==========================================

const CACHE_VERSION = "lumi-v1.0";

const CACHE_NAME = `lumi-cache-${CACHE_VERSION}`;

// ==========================================
// الملفات اللي هتتخزن للأوفلاين
// ==========================================

const CACHE_FILES = [

    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./js/app.js",
    "./js/ui.js",
    "./js/api.js",
    "./js/storage.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png",

    // مكتبات خارجية
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap",
    "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
    "https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/highlight.min.js",
    "https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github-dark.min.css",
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"

];

// ==========================================
// Install Event - تخزين الملفات
// ==========================================

self.addEventListener("install", (event) => {

    console.log("[SW] جاري التثبيت...");

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then((cache) => {

                console.log("[SW] جاري تخزين الملفات...");

                // نخزن كل ملف على حدة عشان لو حصل خطأ في ملف واحد
                // مايوقفش الباقي
                return Promise.allSettled(

                    CACHE_FILES.map(url =>

                        cache.add(url).catch(err => {

                            console.warn(`[SW] فشل تخزين: ${url}`, err);

                        })

                    )

                );

            })
            .then(() => {

                console.log("[SW] تم التثبيت بنجاح ✅");

                // تفعيل الـ SW الجديد فوراً
                return self.skipWaiting();

            })

    );

});

// ==========================================
// Activate Event - تفعيل و حذف الكاش القديم
// ==========================================

self.addEventListener("activate", (event) => {

    console.log("[SW] جاري التفعيل...");

    event.waitUntil(

        caches.keys().then((cacheNames) => {

            return Promise.all(

                cacheNames.map((name) => {

                    // حذف أي كاش قديم غير النسخة الحالية
                    if(name !== CACHE_NAME){

                        console.log(`[SW] حذف الكاش القديم: ${name}`);
                        return caches.delete(name);

                    }

                })

            );

        }).then(() => {

            console.log("[SW] تم التفعيل ✅");

            // السيطرة على كل الصفحات المفتوحة فوراً
            return self.clients.claim();

        })

    );

});

// ==========================================
// Fetch Event - التعامل مع الطلبات
// ==========================================

self.addEventListener("fetch", (event) => {

    const request = event.request;
    const url = new URL(request.url);

    // ✨ استراتيجية خاصة لطلبات الـ API (Groq)
    // دايماً من النت، مش من الكاش
    if(url.hostname.includes("groq.com")){

        event.respondWith(

            fetch(request).catch(() => {

                // لو مفيش نت، نرجع رسالة خطأ
                return new Response(

                    JSON.stringify({

                        error: {
                            message: "لا يوجد اتصال بالإنترنت. الرجاء المحاولة عند عودة الاتصال."
                        }

                    }),

                    {
                        status: 503,
                        headers: { "Content-Type": "application/json" }
                    }

                );

            })

        );

        return;

    }

    // ✨ استراتيجية للملفات الأخرى: Cache First, Network Fallback
    event.respondWith(

        caches.match(request)
            .then((cachedResponse) => {

                // لو الملف موجود في الكاش، نرجعه
                if(cachedResponse){

                    // بس في نفس الوقت نحدثه من النت في الخلفية
                    fetch(request)
                        .then((networkResponse) => {

                            if(networkResponse && networkResponse.status === 200){

                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, networkResponse);
                                    });

                            }

                        })
                        .catch(() => {
                            // مفيش نت، مش مشكلة
                        });

                    return cachedResponse;

                }

                // لو مش في الكاش، نجيبه من النت
                return fetch(request)
                    .then((networkResponse) => {

                        // نخزنه للمرة الجاية
                        if(networkResponse && networkResponse.status === 200){

                            const responseClone = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });

                        }

                        return networkResponse;

                    })
                    .catch(() => {

                        // مفيش نت ومفيش كاش
                        // لو الطلب لصفحة HTML، نرجع الصفحة الرئيسية
                        if(request.destination === "document"){
                            return caches.match("./index.html");
                        }

                    });

            })

    );

});

// ==========================================
// Message Event - استقبال رسائل من التطبيق
// ==========================================

self.addEventListener("message", (event) => {

    // لو التطبيق طلب تحديث الـ SW
    if(event.data && event.data.type === "SKIP_WAITING"){
        self.skipWaiting();
    }

    // لو التطبيق طلب مسح الكاش
    if(event.data && event.data.type === "CLEAR_CACHE"){

        caches.keys().then((cacheNames) => {

            return Promise.all(
                cacheNames.map(name => caches.delete(name))
            );

        }).then(() => {

            event.ports[0].postMessage({ success: true });

        });

    }

});
// ==========================================
// Lumi AI UI
// ==========================================

import {
    getSettings,
    saveSetting,
    resetSettings
} from "./storage.js";

// ==========================================
// Elements
// ==========================================

export const elements = {

    sidebar: document.getElementById("sidebar"),
    menuBtn: document.getElementById("menu"),
    newChatBtn: document.getElementById("new-chat"),
    clearChatBtn: document.getElementById("clear-chat"),
    chatList: document.getElementById("chat-list"),
    messages: document.getElementById("messages"),
    prompt: document.getElementById("prompt"),
    sendBtn: document.getElementById("send"),
    imageBtn: document.getElementById("image-btn"),
    imageInput: document.getElementById("image-input"),

    settingsBtn: document.getElementById("settings-btn"),
    settingsModal: document.getElementById("settings-modal"),
    settingsClose: document.getElementById("settings-close"),
    themeToggle: document.getElementById("theme-toggle"),
    colorPicker: document.getElementById("color-picker"),
    fontSizePicker: document.getElementById("font-size-picker"),
    soundToggle: document.getElementById("sound-toggle"),
    animationsToggle: document.getElementById("animations-toggle"),
    resetBtn: document.getElementById("reset-settings"),

    exportBtn: document.getElementById("export-btn"),
    exportMenu: document.getElementById("export-menu"),

    closeSidebarBtn: document.getElementById("close-sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),

    searchInput: document.getElementById("search-input"),
    searchClear: document.getElementById("search-clear"),
    searchResultsInfo: document.getElementById("search-results-info"),

    imagePreview: document.getElementById("image-preview"),
    imagePreviewImg: document.getElementById("image-preview-img"),
    imagePreviewName: document.getElementById("image-preview-name"),
    imagePreviewRemove: document.getElementById("image-preview-remove"),

    // ✨ عناصر PWA الجديدة
    offlineIndicator: document.getElementById("offline-indicator"),
    installBanner: document.getElementById("install-banner"),
    installBtn: document.getElementById("install-btn"),
    installClose: document.getElementById("install-close"),
    installAppBtn: document.getElementById("install-app-btn"),
    clearCacheBtn: document.getElementById("clear-cache-btn"),
    pwaStatus: document.getElementById("pwa-status"),
    pwaStatusIcon: document.getElementById("pwa-status-icon"),
    pwaStatusText: document.getElementById("pwa-status-text")

};

// ==========================================
// Create Message
// ==========================================

export function createMessage(content, isUser=false){

    const msg=document.createElement("div");
    msg.className=`message ${isUser?"user":"bot"}`;

    if(Array.isArray(content)){

        let textPart = "";
        let imageUrl = null;

        content.forEach(item=>{

            if(item.type === "text") textPart = item.text;
            else if(item.type === "image_url") imageUrl = item.image_url.url;

        });

        if(imageUrl){

            const img = document.createElement("img");
            img.src = imageUrl;
            img.className = "message-image";
            img.alt = "صورة";
            img.onclick = ()=> openImageViewer(imageUrl);
            msg.appendChild(img);

        }

        if(textPart){

            const textDiv = document.createElement("div");
            textDiv.className = "message-text";

            if(isUser) textDiv.textContent = textPart;
            else textDiv.innerHTML = marked.parse(textPart);

            msg.appendChild(textDiv);

        }

    }
    else{

        if(isUser){
            msg.textContent = content;
        }else{

            msg.innerHTML = marked.parse(content);

            msg.querySelectorAll("pre code").forEach(block=>{
                hljs.highlightElement(block);
                addCopyButton(block);
            });

            playNotificationSound();

        }

    }

    msg.querySelectorAll("pre code").forEach(block=>{
        hljs.highlightElement(block);
        addCopyButton(block);
    });

    elements.messages.appendChild(msg);
    scrollBottom();

    return msg;

}

// ==========================================
// Type Message
// ==========================================

export async function typeMessage(text){

    const msg=document.createElement("div");
    msg.className="message bot";
    elements.messages.appendChild(msg);

    let output="";

    for(const ch of text){
        output+=ch;
        msg.innerHTML=marked.parse(output);
        scrollBottom();
        await new Promise(r=>setTimeout(r,8));
    }

    msg.querySelectorAll("pre code").forEach(block=>{
        hljs.highlightElement(block);
        addCopyButton(block);
    });

    playNotificationSound();

}

// ==========================================
// Clear Messages
// ==========================================

export function clearMessages(){
    elements.messages.innerHTML="";
}

// ==========================================
// Loader
// ==========================================

let loader=null;

export function showLoader(){

    loader=document.createElement("div");
    loader.className="message bot";
    loader.innerHTML=`
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    elements.messages.appendChild(loader);
    scrollBottom();

}

export function hideLoader(){

    if(loader){
        loader.remove();
        loader=null;
    }

}

// ==========================================
// Scroll
// ==========================================

export function scrollBottom(){
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

// ==========================================
// Toggle Sidebar
// ==========================================

export function toggleSidebar(){

    const isMobile = window.innerWidth <= 768;

    if(isMobile){

        const isOpen = elements.sidebar.classList.contains("open");

        if(isOpen){
            elements.sidebar.classList.remove("open");
            elements.sidebarOverlay.classList.remove("visible");
        }else{
            elements.sidebar.classList.remove("closed");
            elements.sidebar.classList.add("open");
            elements.sidebarOverlay.classList.add("visible");
        }

    }else{

        elements.sidebar.classList.toggle("closed");
        elements.sidebar.classList.remove("open");

    }

}

export function closeSidebar(){

    const isMobile = window.innerWidth <= 768;

    if(isMobile){
        elements.sidebar.classList.remove("open");
        elements.sidebarOverlay.classList.remove("visible");
    }else{
        elements.sidebar.classList.add("closed");
        elements.sidebar.classList.remove("open");
    }

}

// ==========================================
// Copy Button
// ==========================================

function addCopyButton(code){

    const pre=code.parentElement;
    if(pre.querySelector(".copy-btn")) return;

    const btn=document.createElement("button");
    btn.className="copy-btn";
    btn.textContent="نسخ";

    btn.onclick=()=>{
        navigator.clipboard.writeText(code.innerText);
        btn.textContent="✓";
        setTimeout(()=> btn.textContent="نسخ", 1500);
    };

    pre.style.position="relative";
    btn.style.position="absolute";
    btn.style.top="10px";
    btn.style.left="10px";
    btn.style.padding="4px 8px";
    btn.style.border="none";
    btn.style.borderRadius="6px";
    btn.style.cursor="pointer";
    pre.appendChild(btn);

}

// ==========================================
// Apply Settings
// ==========================================

export function applySettings(){

    const settings = getSettings();
    const root = document.documentElement;

    root.setAttribute("data-theme", settings.theme);
    root.setAttribute("data-color", settings.color);
    root.setAttribute("data-font", settings.fontSize);
    root.setAttribute("data-animations", settings.animationsEnabled ? "on" : "off");

}

// ==========================================
// Notification Sound
// ==========================================

function playNotificationSound(){

    const settings = getSettings();
    if(!settings.soundEnabled) return;

    try{

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);

    }catch(err){
        console.warn("Sound error:", err);
    }

}

// ==========================================
// Settings Modal
// ==========================================

export function openSettings(){
    updateSettingsUI();
    updatePWAStatus();
    elements.settingsModal.classList.add("open");
}

export function closeSettings(){
    elements.settingsModal.classList.remove("open");
}

function updateSettingsUI(){

    const settings = getSettings();

    elements.themeToggle.querySelectorAll("button").forEach(btn=>{
        btn.classList.toggle("active", btn.dataset.value === settings.theme);
    });

    elements.colorPicker.querySelectorAll(".color-option").forEach(opt=>{
        opt.classList.toggle("active", opt.dataset.value === settings.color);
    });

    elements.fontSizePicker.querySelectorAll("button").forEach(btn=>{
        btn.classList.toggle("active", btn.dataset.value === settings.fontSize);
    });

    elements.soundToggle.checked = settings.soundEnabled;
    elements.animationsToggle.checked = settings.animationsEnabled;

}

export function setupSettingsEvents(){

    elements.settingsBtn.addEventListener("click", openSettings);
    elements.settingsClose.addEventListener("click", closeSettings);

    elements.settingsModal.addEventListener("click", e=>{
        if(e.target === elements.settingsModal) closeSettings();
    });

    elements.themeToggle.querySelectorAll("button").forEach(btn=>{
        btn.addEventListener("click", ()=>{
            saveSetting("theme", btn.dataset.value);
            applySettings();
            updateSettingsUI();
        });
    });

    elements.colorPicker.querySelectorAll(".color-option").forEach(opt=>{
        opt.addEventListener("click", ()=>{
            saveSetting("color", opt.dataset.value);
            applySettings();
            updateSettingsUI();
        });
    });

    elements.fontSizePicker.querySelectorAll("button").forEach(btn=>{
        btn.addEventListener("click", ()=>{
            saveSetting("fontSize", btn.dataset.value);
            applySettings();
            updateSettingsUI();
        });
    });

    elements.soundToggle.addEventListener("change", ()=>{
        saveSetting("soundEnabled", elements.soundToggle.checked);
        if(elements.soundToggle.checked) playNotificationSound();
    });

    elements.animationsToggle.addEventListener("change", ()=>{
        saveSetting("animationsEnabled", elements.animationsToggle.checked);
        applySettings();
    });

    elements.resetBtn.addEventListener("click", ()=>{
        if(confirm("هل تريد إعادة كل الإعدادات للوضع الافتراضي؟")){
            resetSettings();
            applySettings();
            updateSettingsUI();
        }
    });

    document.addEventListener("keydown", e=>{
        if(e.key === "Escape" && elements.settingsModal.classList.contains("open")){
            closeSettings();
        }
    });

}

// ==========================================
// Toast
// ==========================================

export function showToast(message, duration = 2500){

    const oldToast = document.querySelector(".toast");
    if(oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(()=> toast.classList.add("show"), 10);

    setTimeout(()=>{
        toast.classList.remove("show");
        setTimeout(()=> toast.remove(), 300);
    }, duration);

}

// ==========================================
// Download & Export
// ==========================================

function downloadFile(filename, content, type){

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

}

function getFileName(chatTitle, extension){

    const cleanTitle = (chatTitle || "chat")
        .replace(/[<>:"/\\|?*]/g, "")
        .substring(0, 40)
        .trim();

    const date = new Date().toISOString().split("T")[0];
    return `Lumi_${cleanTitle}_${date}.${extension}`;

}

function extractText(content){

    if(typeof content === "string") return content;

    if(Array.isArray(content)){
        const textItem = content.find(item => item.type === "text");
        return textItem ? textItem.text : "[صورة]";
    }

    return "";

}

export function exportAsTxt(chat){

    if(!chat || !chat.messages || chat.messages.length === 0){
        showToast("⚠️ لا توجد رسائل للتصدير");
        return;
    }

    let content = "";
    content += "═══════════════════════════════════\n";
    content += `      Lumi AI - ${chat.title}\n`;
    content += `      ${new Date(chat.createdAt).toLocaleString("ar-EG")}\n`;
    content += "═══════════════════════════════════\n\n";

    chat.messages.forEach((msg) => {
        const role = msg.role === "user" ? "👤 أنت" : "🤖 Lumi AI";
        const text = extractText(msg.content);
        content += `${role}:\n${text}\n\n───────────────────────────────────\n\n`;
    });

    content += `\n📊 عدد الرسائل: ${chat.messages.length}\n`;
    content += `📤 تم التصدير: ${new Date().toLocaleString("ar-EG")}\n`;

    downloadFile(
        getFileName(chat.title, "txt"),
        content,
        "text/plain;charset=utf-8"
    );

    showToast("✅ تم تصدير المحادثة بنجاح");

}

export function exportAsMarkdown(chat){

    if(!chat || !chat.messages || chat.messages.length === 0){
        showToast("⚠️ لا توجد رسائل للتصدير");
        return;
    }

    let content = "";
    content += `# 🤖 ${chat.title}\n\n`;
    content += `> **التاريخ:** ${new Date(chat.createdAt).toLocaleString("ar-EG")}\n`;
    content += `> **عدد الرسائل:** ${chat.messages.length}\n\n---\n\n`;

    chat.messages.forEach((msg) => {
        const text = extractText(msg.content);
        if(msg.role === "user"){
            content += `### 👤 أنت\n\n${text}\n\n`;
        }else{
            content += `### 🤖 Lumi AI\n\n${text}\n\n`;
        }
        content += `---\n\n`;
    });

    content += `\n*📤 تم التصدير من Lumi AI في ${new Date().toLocaleString("ar-EG")}*\n`;

    downloadFile(
        getFileName(chat.title, "md"),
        content,
        "text/markdown;charset=utf-8"
    );

    showToast("✅ تم تصدير المحادثة بنجاح");

}

export async function exportAsImage(chat){

    if(!chat || !chat.messages || chat.messages.length === 0){
        showToast("⚠️ لا توجد رسائل للتصدير");
        return;
    }

    if(typeof html2canvas === "undefined"){
        showToast("❌ مكتبة التصدير غير محملة");
        return;
    }

    showToast("⏳ جاري إنشاء الصورة...", 5000);

    try{

        const bgColor = getComputedStyle(document.body)
            .getPropertyValue("--bg").trim() || "#0f172a";

        const canvas = await html2canvas(elements.messages, {
            backgroundColor: bgColor,
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: elements.messages.scrollWidth,
            windowHeight: elements.messages.scrollHeight
        });

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = getFileName(chat.title, "png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("✅ تم حفظ الصورة بنجاح");
        }, "image/png");

    }catch(err){
        console.error("Export image error:", err);
        showToast("❌ فشل تصدير الصورة");
    }

}

export function toggleExportMenu(){
    elements.exportMenu.classList.toggle("open");
}

export function closeExportMenu(){
    elements.exportMenu.classList.remove("open");
}

// ==========================================
// Image Preview
// ==========================================

export function showImagePreview(imageData, fileName){
    elements.imagePreviewImg.src = imageData;
    elements.imagePreviewName.textContent = fileName;
    elements.imagePreview.classList.add("visible");
    elements.imageBtn.classList.add("active");
}

export function hideImagePreview(){
    elements.imagePreview.classList.remove("visible");
    elements.imagePreviewImg.src = "";
    elements.imagePreviewName.textContent = "";
    elements.imageBtn.classList.remove("active");
    elements.imageInput.value = "";
}

// ==========================================
// Image Viewer
// ==========================================

export function openImageViewer(imageUrl){

    let viewer = document.querySelector(".image-viewer");

    if(!viewer){

        viewer = document.createElement("div");
        viewer.className = "image-viewer";
        viewer.innerHTML = `
            <button class="image-viewer-close">✕</button>
            <img src="" alt="Full size">
        `;
        document.body.appendChild(viewer);

        viewer.addEventListener("click", ()=>{
            viewer.classList.remove("open");
        });

        viewer.querySelector("img").addEventListener("click", e=>{
            e.stopPropagation();
        });

    }

    viewer.querySelector("img").src = imageUrl;
    viewer.classList.add("open");

}

// ==========================================
// Search
// ==========================================

export function highlightText(text, query){
    if(!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
    return escaped.replace(regex, '<mark class="search-match">$1</mark>');
}

function escapeHtml(text){
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(text){
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchInChats(chats, query){

    if(!query || !query.trim()){
        return { results: chats, matches: 0 };
    }

    const q = query.toLowerCase().trim();
    let totalMatches = 0;

    const results = chats.map(chat => {

        const titleMatch = chat.title.toLowerCase().includes(q);
        let matchedMessage = null;

        for(const msg of chat.messages){
            const text = extractText(msg.content).toLowerCase();
            if(text.includes(q)){
                matchedMessage = extractText(msg.content);
                break;
            }
        }

        if(titleMatch || matchedMessage){
            totalMatches++;
            return {
                ...chat,
                _matchedMessage: matchedMessage,
                _titleMatch: titleMatch
            };
        }

        return null;

    }).filter(Boolean);

    return { results, matches: totalMatches };

}

// ==========================================
// ✨ PWA: تسجيل Service Worker
// ==========================================

export async function registerServiceWorker(){

    if(!("serviceWorker" in navigator)){
        console.warn("[PWA] المتصفح لا يدعم Service Worker");
        return;
    }

    try{

        const registration = await navigator.serviceWorker.register(
            "./sw.js",
            { scope: "./" }
        );

        console.log("[PWA] تم تسجيل SW بنجاح:", registration.scope);

        // مراقبة التحديثات
        registration.addEventListener("updatefound", ()=>{

            const newWorker = registration.installing;

            newWorker.addEventListener("statechange", ()=>{

                if(
                    newWorker.state === "installed"
                    &&
                    navigator.serviceWorker.controller
                ){
                    showToast("🔄 يوجد تحديث جديد، أعد تحميل الصفحة", 5000);
                }

            });

        });

    }catch(err){
        console.error("[PWA] فشل تسجيل SW:", err);
    }

}

// ==========================================
// ✨ PWA: مراقبة حالة الاتصال
// ==========================================

export function setupOnlineStatus(){

    function updateStatus(){

        if(navigator.onLine){
            elements.offlineIndicator.classList.remove("visible");
        }else{
            elements.offlineIndicator.classList.add("visible");
        }

    }

    window.addEventListener("online", ()=>{
        updateStatus();
        showToast("✅ تم استعادة الاتصال");
    });

    window.addEventListener("offline", ()=>{
        updateStatus();
        showToast("📡 انقطع الاتصال");
    });

    updateStatus();

}

// ==========================================
// ✨ PWA: زرار التثبيت
// ==========================================

let deferredPrompt = null;

export function setupInstallPrompt(){

    // التقاط حدث التثبيت
    window.addEventListener("beforeinstallprompt", (e)=>{

        e.preventDefault();
        deferredPrompt = e;

        console.log("[PWA] التطبيق قابل للتثبيت");

        // إظهار البانر بعد 3 ثواني
        setTimeout(()=>{

            // لو المستخدم مقفلش البانر قبل كده
            const bannerClosed = localStorage.getItem("install_banner_closed");

            if(!bannerClosed){
                elements.installBanner.classList.add("visible");
            }

            // إظهار زرار في الإعدادات
            elements.installAppBtn.style.display = "block";

        }, 3000);

    });

    // زرار التثبيت في البانر
    elements.installBtn.addEventListener("click", async ()=>{

        if(!deferredPrompt){
            showToast("⚠️ التثبيت غير متاح حالياً");
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log("[PWA] نتيجة التثبيت:", outcome);

        if(outcome === "accepted"){
            showToast("🎉 تم تثبيت التطبيق بنجاح");
        }

        deferredPrompt = null;
        elements.installBanner.classList.remove("visible");
        elements.installAppBtn.style.display = "none";

    });

    // زرار غلق البانر
    elements.installClose.addEventListener("click", ()=>{
        elements.installBanner.classList.remove("visible");
        localStorage.setItem("install_banner_closed", "1");
    });

    // زرار التثبيت في الإعدادات
    elements.installAppBtn.addEventListener("click", async ()=>{

        if(!deferredPrompt){
            showToast("⚠️ التطبيق مثبت بالفعل أو غير متاح");
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if(outcome === "accepted"){
            showToast("🎉 تم تثبيت التطبيق بنجاح");
            elements.installAppBtn.style.display = "none";
            updatePWAStatus();
        }

        deferredPrompt = null;

    });

    // لما التطبيق يتثبت
    window.addEventListener("appinstalled", ()=>{

        console.log("[PWA] تم تثبيت التطبيق");
        showToast("🎉 مرحباً بك في Lumi AI!");
        elements.installBanner.classList.remove("visible");
        elements.installAppBtn.style.display = "none";
        deferredPrompt = null;
        updatePWAStatus();

    });

}

// ==========================================
// ✨ PWA: تحديث حالة التطبيق
// ==========================================

export function updatePWAStatus(){

    if(!elements.pwaStatus) return;

    // فحص إذا كان التطبيق مثبت (شغال في وضع standalone)
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches
        ||
        window.navigator.standalone
        ||
        document.referrer.includes("android-app://");

    if(isStandalone){

        elements.pwaStatus.classList.add("installed");
        elements.pwaStatusIcon.textContent = "✅";
        elements.pwaStatusText.textContent = "التطبيق مثبت ويعمل";
        elements.installAppBtn.style.display = "none";

    }else{

        elements.pwaStatus.classList.remove("installed");
        elements.pwaStatusIcon.textContent = "🌐";
        elements.pwaStatusText.textContent = "شغال في المتصفح";

        // لو التثبيت متاح، اظهر الزرار
        if(deferredPrompt){
            elements.installAppBtn.style.display = "block";
        }

    }

}

// ==========================================
// ✨ PWA: مسح الكاش
// ==========================================

export function setupClearCache(){

    elements.clearCacheBtn.addEventListener("click", async ()=>{

        if(!confirm("هل تريد مسح الكاش وإعادة تحميل التطبيق؟\n(لن يتم مسح المحادثات)")){
            return;
        }

        try{

            // مسح كل الـ caches
            if("caches" in window){

                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));

            }

            // إرسال رسالة للـ SW لمسح الكاش
            if(navigator.serviceWorker.controller){

                const messageChannel = new MessageChannel();

                navigator.serviceWorker.controller.postMessage(
                    { type: "CLEAR_CACHE" },
                    [messageChannel.port2]
                );

            }

            showToast("✅ تم مسح الكاش، جاري إعادة التحميل...");

            setTimeout(()=>{
                window.location.reload(true);
            }, 1000);

        }catch(err){
            console.error("Clear cache error:", err);
            showToast("❌ فشل مسح الكاش");
        }

    });

}
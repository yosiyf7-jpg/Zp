// ==========================================
// Lumi AI
// app.js
// ==========================================

import { fetchBotResponse } from "./api.js";

import {
    elements,
    createMessage,
    typeMessage,
    clearMessages,
    showLoader,
    hideLoader,
    scrollBottom,
    toggleSidebar,
    closeSidebar,
    applySettings,
    setupSettingsEvents,
    toggleExportMenu,
    closeExportMenu,
    exportAsTxt,
    exportAsMarkdown,
    exportAsImage,
    showToast,
    showImagePreview,
    hideImagePreview,
    searchInChats,
    highlightText,
    // ✨ استيراد دوال PWA
    registerServiceWorker,
    setupOnlineStatus,
    setupInstallPrompt,
    setupClearCache,
    updatePWAStatus
} from "./ui.js";

import {
    getChats,
    addChat,
    updateChat,
    deleteChat
} from "./storage.js";

let chats = [];
let currentChat = null;

let selectedImage = null;
let selectedImageName = null;
let searchQuery = "";

// ==========================================

window.addEventListener("DOMContentLoaded", init);

// ==========================================

function init(){

    applySettings();

    chats = getChats();

    if(chats.length === 0){
        currentChat = addChat();
        chats = getChats();
    }else{
        currentChat = chats[0];
    }

    renderSidebar();
    renderMessages();
    setupEvents();
    setupSettingsEvents();
    setupExportEvents();
    setupSidebarEvents();
    setupSearchEvents();
    setupImageEvents();

    // ✨ تفعيل مميزات PWA
    setupPWA();

    // ✨ التعامل مع اختصار "محادثة جديدة" من الشاشة الرئيسية
    handleShortcuts();

}

// ==========================================
// ✨ ميزة جديدة: تفعيل PWA
// ==========================================

function setupPWA(){

    // تسجيل Service Worker
    registerServiceWorker();

    // مراقبة حالة الاتصال
    setupOnlineStatus();

    // زرار التثبيت
    setupInstallPrompt();

    // مسح الكاش
    setupClearCache();

    // تحديث حالة التطبيق
    updatePWAStatus();

}

// ==========================================
// ✨ التعامل مع الاختصارات (Shortcuts)
// ==========================================

function handleShortcuts(){

    const params = new URLSearchParams(window.location.search);

    // لو المستخدم فتح "محادثة جديدة" من الاختصار
    if(params.get("new") === "1"){

        currentChat = addChat();
        chats = getChats();
        renderSidebar();
        renderMessages();

        // تنظيف الـ URL
        window.history.replaceState({}, document.title, window.location.pathname);

    }

}

// ==========================================

function setupEvents(){

    elements.sendBtn.addEventListener("click", sendMessage);

    elements.prompt.addEventListener("keydown", e=>{
        if(e.key==="Enter" && !e.shiftKey){
            e.preventDefault();
            sendMessage();
        }
    });

    elements.menuBtn.addEventListener("click", toggleSidebar);

    elements.newChatBtn.addEventListener("click", ()=>{
        currentChat = addChat();
        chats = getChats();
        renderSidebar();
        renderMessages();
    });

    elements.clearChatBtn.addEventListener("click", clearCurrentChat);

}

// ==========================================
// Sidebar Events
// ==========================================

function setupSidebarEvents(){

    elements.closeSidebarBtn.addEventListener("click", closeSidebar);
    elements.sidebarOverlay.addEventListener("click", closeSidebar);

}

// ==========================================
// Search Events
// ==========================================

function setupSearchEvents(){

    elements.searchInput.addEventListener("input", ()=>{

        searchQuery = elements.searchInput.value;

        if(searchQuery){
            elements.searchClear.classList.add("visible");
        }else{
            elements.searchClear.classList.remove("visible");
        }

        renderSidebar();

    });

    elements.searchClear.addEventListener("click", ()=>{
        elements.searchInput.value = "";
        searchQuery = "";
        elements.searchClear.classList.remove("visible");
        elements.searchInput.focus();
        renderSidebar();
    });

    elements.searchInput.addEventListener("keydown", e=>{
        if(e.key === "Escape"){
            elements.searchInput.value = "";
            searchQuery = "";
            elements.searchClear.classList.remove("visible");
            elements.searchInput.blur();
            renderSidebar();
        }
    });

}

// ==========================================
// Image Events
// ==========================================

function setupImageEvents(){

    elements.imageBtn.addEventListener("click", ()=>{

        if(selectedImage){
            showToast("💡 اضغط على ✕ لإزالة الصورة الحالية");
            return;
        }

        elements.imageInput.click();

    });

    elements.imageInput.addEventListener("change", e=>{

        const file = e.target.files[0];
        if(!file) return;

        if(!file.type.startsWith("image/")){
            showToast("⚠️ الرجاء اختيار صورة فقط");
            return;
        }

        if(file.size > 4 * 1024 * 1024){
            showToast("⚠️ حجم الصورة كبير جداً (الحد الأقصى 4 MB)");
            return;
        }

        const reader = new FileReader();

        reader.onload = ()=>{
            selectedImage = reader.result;
            selectedImageName = file.name;
            showImagePreview(selectedImage, file.name);
            elements.prompt.focus();
        };

        reader.readAsDataURL(file);

    });

    elements.imagePreviewRemove.addEventListener("click", ()=>{
        selectedImage = null;
        selectedImageName = null;
        hideImagePreview();
    });

}

// ==========================================
// Export Events
// ==========================================

function setupExportEvents(){

    elements.exportBtn.addEventListener("click", e=>{
        e.stopPropagation();
        toggleExportMenu();
    });

    document.addEventListener("click", e=>{
        if(!elements.exportMenu.contains(e.target) && e.target !== elements.exportBtn){
            closeExportMenu();
        }
    });

    elements.exportMenu.querySelectorAll("button").forEach(btn=>{

        btn.addEventListener("click", ()=>{

            const format = btn.dataset.format;

            if(!currentChat){
                showToast("⚠️ لا توجد محادثة للتصدير");
                closeExportMenu();
                return;
            }

            switch(format){
                case "txt": exportAsTxt(currentChat); break;
                case "md":  exportAsMarkdown(currentChat); break;
                case "png": exportAsImage(currentChat); break;
            }

            closeExportMenu();

        });

    });

    document.addEventListener("keydown", e=>{
        if(e.key === "Escape" && elements.exportMenu.classList.contains("open")){
            closeExportMenu();
        }
    });

}

// ==========================================

function renderMessages(){

    clearMessages();
    if(!currentChat) return;

    currentChat.messages.forEach(msg=>{
        createMessage(msg.content, msg.role==="user");
    });

    scrollBottom();

}

// ==========================================
// Send Message
// ==========================================

async function sendMessage(){

    const text = elements.prompt.value.trim();

    if(!text && !selectedImage) return;

    // ✨ فحص الاتصال قبل الإرسال
    if(!navigator.onLine){
        showToast("📡 لا يوجد اتصال بالإنترنت");
        return;
    }

    let userContent;
    let displayContent;

    if(selectedImage){

        userContent = [
            {
                type: "text",
                text: text || "ما محتوى هذه الصورة؟"
            },
            {
                type: "image_url",
                image_url: { url: selectedImage }
            }
        ];

        displayContent = userContent;

    }else{
        userContent = text;
        displayContent = text;
    }

    createMessage(displayContent, true);

    currentChat.messages.push({
        role: "user",
        content: userContent
    });

    if(
        currentChat.title === "محادثة جديدة"
        &&
        currentChat.messages.length === 1
    ){
        const titleText = text || "تحليل صورة";
        currentChat.title = titleText.substring(0, 30);
    }

    updateChat(currentChat);
    renderSidebar();

    elements.prompt.value = "";
    elements.prompt.style.height = "auto";

    const hadImage = !!selectedImage;
    selectedImage = null;
    selectedImageName = null;
    if(hadImage) hideImagePreview();

    showLoader();

    try{

        const reply = await fetchBotResponse(currentChat.messages);

        hideLoader();

        await typeMessage(reply);

        currentChat.messages.push({
            role: "assistant",
            content: reply
        });

        updateChat(currentChat);
        renderSidebar();

    }
    catch(err){

        hideLoader();
        createMessage("❌ " + err.message, false);
        console.error(err);

    }

}

// ==========================================
// Auto Resize
// ==========================================

elements.prompt.addEventListener("input", ()=>{
    elements.prompt.style.height = "0px";
    elements.prompt.style.height = elements.prompt.scrollHeight + "px";
});

// ==========================================
// Sidebar
// ==========================================

function renderSidebar(){

    chats = getChats();

    const { results, matches } = searchInChats(chats, searchQuery);

    if(searchQuery){
        elements.searchResultsInfo.classList.add("visible");
        if(matches === 0){
            elements.searchResultsInfo.textContent = "❌ لا توجد نتائج";
        }else{
            elements.searchResultsInfo.textContent = `✅ ${matches} نتيجة`;
        }
    }else{
        elements.searchResultsInfo.classList.remove("visible");
        elements.searchResultsInfo.textContent = "";
    }

    elements.chatList.innerHTML = "";

    results.forEach(chat=>{

        const item = document.createElement("div");
        item.className = "chat-item";

        if(currentChat && chat.id === currentChat.id){
            item.classList.add("active");
        }

        const title = document.createElement("span");
        title.className = "chat-title";

        if(searchQuery){
            title.innerHTML = highlightText(chat.title, searchQuery);
        }else{
            title.textContent = chat.title;
        }

        if(searchQuery && chat._matchedMessage && !chat._titleMatch){

            const preview = document.createElement("span");
            preview.className = "search-preview";
            preview.innerHTML = highlightText(
                chat._matchedMessage.substring(0, 100),
                searchQuery
            );

            const titleWrapper = document.createElement("div");
            titleWrapper.style.flex = "1";
            titleWrapper.style.overflow = "hidden";
            titleWrapper.appendChild(title);
            titleWrapper.appendChild(preview);

            item.appendChild(titleWrapper);

        }else{
            item.appendChild(title);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-chat";
        deleteBtn.textContent = "🗑️";
        deleteBtn.title = "حذف المحادثة";

        deleteBtn.onclick = (e)=>{
            e.stopPropagation();
            deleteSpecificChat(chat.id);
        };

        item.appendChild(deleteBtn);

        item.onclick = ()=>{
            currentChat = chat;
            renderSidebar();
            renderMessages();
            if(window.innerWidth <= 768){
                closeSidebar();
            }
        };

        elements.chatList.appendChild(item);

    });

}

// ==========================================
// Delete Chats
// ==========================================

function deleteSpecificChat(id){

    if(!confirm("هل تريد حذف هذه المحادثة؟")) return;

    deleteChat(id);
    chats = getChats();

    if(currentChat && currentChat.id === id){

        if(chats.length === 0){
            currentChat = addChat();
            chats = getChats();
        }else{
            currentChat = chats[0];
        }

        renderMessages();

    }

    renderSidebar();

}

function clearCurrentChat(){

    if(!currentChat) return;
    if(!confirm("هل تريد حذف هذه المحادثة؟")) return;

    deleteChat(currentChat.id);
    chats = getChats();

    if(chats.length === 0){
        currentChat = addChat();
        chats = getChats();
    }else{
        currentChat = chats[0];
    }

    renderSidebar();
    renderMessages();

}

// ==========================================
// Window Events
// ==========================================

window.addEventListener("load", ()=>{
    elements.prompt.focus();
});

window.addEventListener("beforeunload", ()=>{
    if(currentChat){
        updateChat(currentChat);
    }
});

document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){
        if(window.innerWidth <= 768){
            elements.sidebar.classList.remove("open");
            elements.sidebarOverlay.classList.remove("visible");
        }
    }
});

window.addEventListener("resize", ()=>{
    if(window.innerWidth > 768){
        elements.sidebarOverlay.classList.remove("visible");
    }
});

// ==========================================
// ✨ منع التنقل الخلفي في التطبيق
// (لما التطبيق مثبت، يمنع الخروج بالخطأ)
// ==========================================

window.addEventListener("popstate", (e)=>{

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if(isStandalone){

        // لو فيه Modal مفتوح، اقفله بدل الخروج
        if(elements.settingsModal.classList.contains("open")){
            elements.settingsModal.classList.remove("open");
            history.pushState(null, "", location.href);
            return;
        }

        // لو السايدبار مفتوح في الموبايل
        if(elements.sidebar.classList.contains("open")){
            closeSidebar();
            history.pushState(null, "", location.href);
            return;
        }

    }

});

// إضافة state للتاريخ عشان نقدر نعترض الرجوع
if(window.matchMedia("(display-mode: standalone)").matches){
    history.pushState(null, "", location.href);
}
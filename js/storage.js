// ==========================================
// Lumi AI Storage Manager
// ==========================================

const STORAGE_KEY = "lumi_ai_chats";

// ✨ ميزة جديدة: مفتاح تخزين التفضيلات
const SETTINGS_KEY = "lumi_ai_settings";

// ✨ ميزة جديدة: الإعدادات الافتراضية
const DEFAULT_SETTINGS = {
    theme: "dark",           // dark | light
    color: "blue",           // blue | green | purple | pink | orange | red
    fontSize: "medium",      // small | medium | large
    soundEnabled: true,      // تفعيل صوت الإشعارات
    animationsEnabled: true  // تفعيل الأنيميشن
};

// ==========================================
// Get All Chats
// ==========================================

export function getChats() {

    try {

        const chats = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        return chats || [];

    } catch {

        return [];

    }

}

// ==========================================
// Save Chats
// ==========================================

function saveChats(chats) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );

}

// ==========================================
// Create Chat
// ==========================================

export function addChat() {

    const chats = getChats();

    const chat = {

        id: crypto.randomUUID(),

        title: "محادثة جديدة",

        createdAt: Date.now(),

        messages: []

    };

    chats.unshift(chat);

    saveChats(chats);

    return chat;

}

// ==========================================
// Update Chat
// ==========================================

export function updateChat(chat) {

    const chats = getChats();

    const index = chats.findIndex(
        c => c.id === chat.id
    );

    if (index !== -1) {

        chats[index] = chat;

    }

    saveChats(chats);

}

// ==========================================
// Delete Chat
// ==========================================

export function deleteChat(id) {

    const chats = getChats().filter(
        chat => chat.id !== id
    );

    saveChats(chats);

}

// ==========================================
// Get One Chat
// ==========================================

export function getChat(id) {

    return getChats().find(
        chat => chat.id === id
    );

}

// ==========================================
// Delete All Chats
// ==========================================

export function clearChats() {

    localStorage.removeItem(STORAGE_KEY);

}

// ==========================================
// ✨ ميزة جديدة: Get Settings
// جلب إعدادات المستخدم
// ==========================================

export function getSettings() {

    try {

        const settings = JSON.parse(
            localStorage.getItem(SETTINGS_KEY)
        );

        // دمج الإعدادات المحفوظة مع الافتراضية
        // عشان لو أضفنا إعدادات جديدة مستقبلاً
        return { ...DEFAULT_SETTINGS, ...settings };

    } catch {

        return { ...DEFAULT_SETTINGS };

    }

}

// ==========================================
// ✨ ميزة جديدة: Save Settings
// حفظ إعداد معين
// ==========================================

export function saveSetting(key, value) {

    const settings = getSettings();

    settings[key] = value;

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );

}

// ==========================================
// ✨ ميزة جديدة: Save All Settings
// حفظ كل الإعدادات مرة واحدة
// ==========================================

export function saveAllSettings(settings) {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );

}

// ==========================================
// ✨ ميزة جديدة: Reset Settings
// إعادة الإعدادات للافتراضي
// ==========================================

export function resetSettings() {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
    );

    return { ...DEFAULT_SETTINGS };

}
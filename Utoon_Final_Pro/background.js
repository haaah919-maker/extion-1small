import { getUserProfile, createUserProfile, updateUsage } from './supabase_client.js';

const CONFIG = {
    smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26",
    base_api: "https://utoon.net/wp-json/icmadara/v1"
};

chrome.runtime.onInstalled.addListener(async () => {
    chrome.storage.local.set({ config: CONFIG });
    let { userId } = await chrome.storage.local.get("userId");
    if (!userId) {
        userId = Math.floor(Math.random() * 9007199254740991);
        await chrome.storage.local.set({ userId });
    }
    try {
        let profile = await getUserProfile(userId);
        if (!profile) await createUserProfile(userId, "Guest_" + userId.toString().slice(-4));
    } catch (e) {}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "check_limit") {
        chrome.storage.local.get("userId").then(async ({ userId }) => {
            try {
                const usage = await updateUsage(userId);
                sendResponse(usage);
            } catch (e) { sendResponse({ allowed: true, plan: "Error" }); }
        });
        return true;
    }
    if (message.action === "get_config") {
        sendResponse(CONFIG);
    }
    if (message.action === "bulk_download") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (images, name, type) => {
                if (window.UtoonBulkDownload) {
                    window.UtoonBulkDownload(images, name, type);
                } else {
                    console.error("Bulk helper not loaded");
                }
            },
            args: [message.images, message.name, message.type]
        });
    }
    // Added for v8 logic compatibility: handling navigation to chapter pages
    if (message.action === "navigate_and_inject") {
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

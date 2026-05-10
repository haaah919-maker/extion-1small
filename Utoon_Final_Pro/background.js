import { getUserProfile, createUserProfile, updateUsage } from './supabase_client.js';

const CONFIG = {
    smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26"
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
    } catch (e) { console.error("Supabase Init Error", e); }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "check_limit") {
        chrome.storage.local.get("userId").then(async ({ userId }) => {
            try {
                const usage = await updateUsage(userId);
                sendResponse(usage);
            } catch (e) {
                console.error("Usage Check Error", e);
                sendResponse({ allowed: true, plan: "Offline Mode" });
            }
        });
        return true;
    }

    if (message.action === "bulk_download") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: "MAIN",
            func: (images, name, type) => {
                if (window.UtoonBulkDownload) {
                    window.UtoonBulkDownload(images, name, type);
                } else {
                    alert("Reader engine still warming up. Please try again in a second!");
                }
            },
            args: [message.images, message.name, message.type]
        });
    }
});

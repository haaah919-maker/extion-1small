chrome.runtime.onInstalled.addListener(() => {
    console.log("Utoon Ultimate Pro Final installed.");
    // Initial configuration
    const config = {
        smart_link: "https://www.profitablegatecpm.com/e3gp5kmvj?key=911ee19e41bd0c121f64562f64ccbb0c26"
    };
    chrome.storage.local.set({ remoteConfig: config });

    // Default limit settings from v7
    chrome.storage.local.set({ vipUnlock: false, dailyCount: 0, lastDate: new Date().toISOString().split('T')[0] });
});

// Auto-injection logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('utoon.net')) {
        // Auto-detect chapter pages and inject reader
        if (tab.url.match(/utoon\.net\/.*\/chapter-.*/)) {
             chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
            }).catch(err => console.log("Injection failed:", err));
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "auto_inject") {
        const tabId = message.tabId || sender.tab.id;
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
        }).catch(err => console.log("Manual injection failed:", err));
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Utoon Ultimate Pro v1.1 installed.");
});

// Auto-injection logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('utoon.net')) {
        // Auto-detect chapter pages
        if (tab.url.match(/utoon\.net\/manga\/.*\/chapter-.*/)) {
             chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
            }).catch(err => console.log("Injection failed:", err));
        }
    }
});

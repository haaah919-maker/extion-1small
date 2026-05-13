chrome.runtime.onInstalled.addListener(() => {
    console.log("Utoon Ultimate Pro v3.0 installed.");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('utoon.net')) {
        // Inject fix_links on all manga listing pages
        if (tab.url.includes('/manga/') && !tab.url.includes('/chapter-')) {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ['fix_links.js']
            }).catch(err => console.log("fix_links injection failed:", err));
        }
        // Inject reader on any chapter page
        if (tab.url.includes('/chapter-')) {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ['jszip.min.js', 'jspdf.min.js', 'reader_logic.js']
            }).catch(err => console.log("Reader injection failed:", err));
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "auto_inject") {
        const tabId = message.tabId || sender.tab.id;
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['jszip.min.js', 'jspdf.min.js', 'reader_logic.js']
        }).catch(err => console.log("Manual injection failed:", err));
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Utoon Ultimate Pro installed.");
    // Initial configuration
    const config = {
        smart_link: "https://www.profitablegatecpm.com/e3gp5kmvj?key=911ee19e41bd0c121f64562f64ccbb0c26"
    };
    chrome.storage.local.set({ remoteConfig: config });
});

// Auto-injection logic if requested by content scripts or tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('utoon.net')) {
        // We could auto-inject here if desired, 
        // but for now we rely on the user clicking the popup for a cleaner experience,
        // or we can auto-inject the reader script.
        
        // Example: Auto-detect chapter pages and prompt or inject
        if (tab.url.match(/utoon\.net\/.*\/chapter-.*/)) {
             chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
            }).catch(err => console.log("Injection failed:", err));
        }
    }
});

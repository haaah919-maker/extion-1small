chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        remoteConfig: { smart_link: "https://www.profitablegatecpm.com/e3gp5kmvj?key=911ee19e41bd0c121f64562f64ccbb0c26" },
        u_premium: false
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('utoon.net')) {
        // Broadly inject reader logic; it handles its own internal routing
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
        }).catch(e => {});
    }
});

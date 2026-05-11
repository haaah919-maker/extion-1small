document.getElementById('inject-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url.includes('utoon.net')) {
            chrome.runtime.sendMessage({ action: "auto_inject", tabId: activeTab.id });
            window.close();
        } else {
            alert("Please go to utoon.net first!");
        }
    });
});

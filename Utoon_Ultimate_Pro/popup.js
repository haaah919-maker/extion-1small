document.getElementById('inject-btn').onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('utoon.net')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
        });
    } else {
        alert('Please open a chapter on utoon.net first!');
    }
};

document.getElementById('discord-btn').onclick = () => {
    window.open('https://discord.gg/utoon', '_blank');
};

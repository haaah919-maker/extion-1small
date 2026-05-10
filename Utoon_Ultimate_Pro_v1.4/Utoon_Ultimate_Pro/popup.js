document.addEventListener('DOMContentLoaded', () => {
    const discordBtn = document.getElementById('discord-btn');
    if (discordBtn) {
        discordBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://discord.com/users/@threads' });
        });
    }

    const injectBtn = document.getElementById('inject-btn');
    if (injectBtn) {
        injectBtn.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    files: ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js']
                });
            });
        });
    }
});

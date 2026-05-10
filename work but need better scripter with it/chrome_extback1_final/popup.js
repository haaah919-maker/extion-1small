document.addEventListener('\x44\x4f\x4d\x43\x6f\x6e\x74\x65\x6e\x74\x4c\x6f\x61\x64\x65\x64', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusDiv = document.getElementById('status');
    const chapterList = document.getElementById('\x63\x68\x61\x70\x74\x65\x72\x2d\x6c\x69\x73\x74');
    const injectBtn = document.getElementById('\x69\x6e\x6a\x65\x63\x74\x2d\x62\x74\x6e');

    if (!tab.url || !tab.url.includes("\x75\x74\x6f\x6f\x6e\x2e\x6e\x65\x74")) {
        statusDiv.innerText = "\x50\x6c\x65\x61\x73\x65\x20\x6f\x70\x65\x6e\x20\x55\x74\x6f\x6f\x6e\x2e\x6e\x65\x74";
        return;
    }

    const mangaUrlBase = tab.url.split('\x23')[0].split('\x3f')[0];

    // Chapter Detection
    if (tab.url.includes("\x2f\x63\x68\x61\x70\x74\x65\x72\x2d") || tab.url.includes("\x23\x63\x68\x61\x70\x74\x65\x72\x2d")) {
        statusDiv.innerText = "\x43\x68\x61\x70\x74\x65\x72\x20\x52\x65\x61\x64\x79";
        injectBtn.style.display = "\x62\x6c\x6f\x63\x6b";
        injectBtn.onclick = () => {
            chrome.storage.local.get(null, (data) => {
                const adLink = data.remoteConfig?.smart_link || "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x70\x72\x6f\x66\x69\x74\x61\x62\x6c\x65\x63\x70\x6d\x72\x61\x74\x65\x6e\x65\x74\x77\x6f\x72\x6b\x2e\x63\x6f\x6d\x2f\x65\x33\x67\x70\x73\x35\x6b\x6d\x76\x6a\x3f\x6b\x65\x79\x3d\x39\x31\x31\x65\x65\x31\x39\x65\x64\x31\x62\x64\x30\x63\x31\x32\x31\x66\x64\x35\x36\x32\x66\x64\x63\x63\x62\x62\x30\x63\x32\x36";
                window.open(adLink, '\x5f\x62\x6c\x61\x6e\x6b');
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['bundle_reader.js']
                });
                window.close();
            });
        };
    }

    // Manga Page Detection
    if (tab.url.includes("\x2f\x6d\x61\x6e\x67\x61\x2f")) {
        statusDiv.innerText = "\x46\x65\x74\x63\x68\x69\x6e\x67\x20\x43\x68\x61\x70\x74\x65\x72\x73\x2e\x2e\x2e";
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (baseUrl) => {
                const list = [];
                document.querySelectorAll('\x2e\x77\x70\x2d\x6d\x61\x6e\x67\x61\x2d\x63\x68\x61\x70\x74\x65\x72').forEach(li => {
                    const a = li.querySelector('\x61');
                    if (!a) return;
                    
                    let title = a.innerText.trim();
                    let url = a.href;

                    // If URL is just #, try to build it from title
                    if (!url || url.endsWith('\x23') || url === '\x23') {
                        // Attempt to reconstruct URL: baseUrl + slugified title
                        // e.g. "\x43\x68\x61\x70\x74\x65\x72\x20\x33\x38" -> "\x63\x68\x61\x70\x74\x65\x72\x2d\x33\x38"
                        let slug = title.toLowerCase().replace(/ /g, '\x2d').replace(/[^a-z0-9-]/g, '');
                        if (baseUrl.endsWith('\x2f')) {
                            url = baseUrl + slug + '\x2f';
                        } else {
                            url = baseUrl + '\x2f' + slug + '\x2f';
                        }
                    }
                    
                    if (title) list.push({ title, url });
                });
                return list;
            },
            args: [mangaUrlBase]
        }, (results) => {
            const chapters = results && results[0] && results[0].result;
            if (chapters && chapters.length > 0) {
                statusDiv.innerText = `Found ${chapters.length} Chapters`;
                chapters.forEach(ch => {
                    const div = document.createElement('\x64\x69\x76');
                    div.className = '\x63\x68\x61\x70\x74\x65\x72\x2d\x69\x74\x65\x6d';
                    div.innerText = ch.title;
                    div.onclick = () => {
                        chrome.storage.local.get(null, (data) => {
                            const adLink = data.remoteConfig?.smart_link || "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x70\x72\x6f\x66\x69\x74\x61\x62\x6c\x65\x63\x70\x6d\x72\x61\x74\x65\x6e\x65\x74\x77\x6f\x72\x6b\x2e\x63\x6f\x6d\x2f\x65\x33\x67\x70\x73\x35\x6b\x6d\x76\x6a\x3f\x6b\x65\x79\x3d\x39\x31\x31\x65\x65\x31\x39\x65\x64\x31\x62\x64\x30\x63\x31\x32\x31\x66\x64\x35\x36\x32\x66\x64\x63\x63\x62\x62\x30\x63\x32\x36";
                            window.open(adLink, '\x5f\x62\x6c\x61\x6e\x6b');
                            chrome.runtime.sendMessage({ action: "auto_inject", tabId: tab.id });
                            chrome.tabs.update(tab.id, { url: ch.url });
                            window.close();
                        });
                    };
                    chapterList.appendChild(div);
                });
            } else {
                statusDiv.innerText = "\x53\x63\x72\x6f\x6c\x6c\x20\x64\x6f\x77\x6e\x20\x74\x6f\x20\x6c\x6f\x61\x64\x20\x63\x68\x61\x70\x74\x65\x72\x73\x2e";
            }
        });
    }
});

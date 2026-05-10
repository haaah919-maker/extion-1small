// Daily Chapter Limit — tracks by chapter URL so same chapter never counts twice
const DAILY_LIMIT = 5;

function checkAndIncrementDailyLimit(chapterKey, callback) {
    const today = new Date().toDateString();
    chrome.storage.local.get(['unlockedChapters','dailyChaptersSet', 'dailyDate'], (data) => {
        const unlocked = new Set(data.unlockedChapters || []);
        // Already purchased forever → open freely
        if (unlocked.has(chapterKey)) {
            callback();
            return;
        }

        let chapSet = (data.dailyDate === today && Array.isArray(data.dailyChaptersSet))
            ? new Set(data.dailyChaptersSet)
            : new Set();

        // Already opened this exact chapter today → open freely, no count
        if (chapSet.has(chapterKey)) {
            callback();
            return;
        }

        // New chapter — check daily limit
        if (chapSet.size >= DAILY_LIMIT) {
            const statusDiv = document.getElementById('status');
            const chapterList = document.getElementById('chapter-list');
            if (statusDiv) {
                statusDiv.innerText = '\u26D4 \u0648\u0635\u0644\u062A \u0644\u0644\u062D\u062F \u0627\u0644\u064A\u0648\u0645\u064A (' + DAILY_LIMIT + ' \u0641\u0635\u0648\u0644). \u0639\u062F \u063A\u062F\u0627\u064B!';
                statusDiv.style.color = '#ff6b6b';
                statusDiv.style.fontSize = '13px';
            }
            if (chapterList) chapterList.innerHTML = '';
            return;
        }

        // New chapter within limit — add to set and save permanently
        chapSet.add(chapterKey);
        unlocked.add(chapterKey);
        chrome.storage.local.set({
            dailyChaptersSet: Array.from(chapSet),
            dailyDate: today,
            unlockedChapters: Array.from(unlocked)
        }, () => { callback(); });
    });
}

document.addEventListener('\x44\x4f\x4d\x43\x6f\x6e\x74\x65\x6e\x74\x4c\x6f\x61\x64\x65\x64', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusDiv = document.getElementById('status');
    const chapterList = document.getElementById('\x63\x68\x61\x70\x74\x65\x72\x2d\x6c\x69\x73\x74');
    const injectBtn = document.getElementById('\x69\x6e\x6a\x65\x63\x74\x2d\x62\x74\x6e');

    if (!tab.url || !tab.url.includes("\x75\x74\x6f\x6f\x6e\x2e\x6e\x65\x74")) {
        statusDiv.innerText = "\x50\x6c\x65\x61\x73\x65\x20\x6f\x70\x65\x6e\x20\x55\x74\x6f\x6f\x6e\x2e\x6e\x65\x74";
        return;
    }

    // Show daily remaining chapters
    const today = new Date().toDateString();
    chrome.storage.local.get(['dailyChaptersSet', 'dailyDate'], (data) => {
        const chapSet = (data.dailyDate === today && Array.isArray(data.dailyChaptersSet))
            ? data.dailyChaptersSet : [];
        const remaining = DAILY_LIMIT - chapSet.length;
        const counterDiv = document.createElement('div');
        counterDiv.style.cssText = 'font-size:12px; color:' + (remaining > 0 ? '#a78bfa' : '#ff6b6b') + '; margin-bottom:6px; text-align:center; font-weight:bold;';
        counterDiv.innerText = remaining > 0
            ? `📚 الفصول المتبقية اليوم: ${remaining} / ${DAILY_LIMIT}`
            : `⛔ انتهت فصولك اليوم! عد غداً`;
        statusDiv.parentNode.insertBefore(counterDiv, statusDiv);
    });

    const mangaUrlBase = tab.url.split('\x23')[0].split('\x3f')[0];

    // Chapter Detection
    if (tab.url.includes("\x2f\x63\x68\x61\x70\x74\x65\x72\x2d") || tab.url.includes("\x23\x63\x68\x61\x70\x74\x65\x72\x2d")) {
        statusDiv.innerText = "\x43\x68\x61\x70\x74\x65\x72\x20\x52\x65\x61\x64\x79";
        injectBtn.style.display = "\x62\x6c\x6f\x63\x6b";
        injectBtn.onclick = () => {
            checkAndIncrementDailyLimit(tab.url, () => {
                chrome.storage.local.get(['unlockedChapters'], (data) => {
                    const unlocked = new Set(data.unlockedChapters || []);
                    const isPurchased = unlocked.has(tab.url);
                    if (!isPurchased) {
                        chrome.storage.local.get(null, (data2) => {
                            const adLink = data2.remoteConfig?.smart_link || "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x70\x72\x6f\x66\x69\x74\x61\x62\x6c\x65\x63\x70\x6d\x72\x61\x74\x65\x6e\x65\x74\x77\x6f\x72\x6b\x2e\x63\x6f\x6d\x2f\x65\x33\x67\x70\x73\x35\x6b\x6d\x76\x6a\x3f\x6b\x65\x79\x3d\x39\x31\x31\x65\x65\x31\x39\x65\x64\x31\x62\x64\x30\x63\x31\x32\x31\x66\x64\x35\x36\x32\x66\x64\x63\x63\x62\x62\x30\x63\x32\x36";
                            window.open(adLink, '\x5f\x62\x6c\x61\x6e\x6b');
                        });
                    }
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['bundle_reader.js']
                    });
                    window.close();
                });
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
                document.querySelectorAll('.wp-manga-chapter').forEach(li => {
                    const a = li.querySelector('a');
                    if (!a) return;

                    // Detect if this chapter is locked (premium)
                    const isLocked = li.classList.contains('premium-block') ||
                                     li.classList.contains('premium') ||
                                     !!li.querySelector('.fa-lock');

                    // Clean title: remove lock icons and extra whitespace
                    let title = (a.innerText || a.textContent || '').trim();
                    title = title.replace(/[\u{1F512}\uF023]/gu, '').trim();
                    title = title.split('\n')[0].trim();
                    // Remove trailing non-word chars (lock char from fontawesome)
                    title = title.replace(/\s*[^\w\s().\-].*$/, '').trim();

                    let url = a.href;
                    const origin = window.location.origin;

                    // Build URL if locked (href="#") or missing
                    if (!url || url === '#' || url === origin + '/#' ||
                        url.endsWith('/#') || url === window.location.href) {
                        let slug = title.toLowerCase()
                            .replace(/ /g, '-')
                            .replace(/[^a-z0-9-]/g, '');
                        url = baseUrl.endsWith('/') 
                            ? baseUrl + slug + '/'
                            : baseUrl + '/' + slug + '/';
                    }

                    if (title) list.push({ title, url, isLocked });
                });
                return list;
            },
            args: [mangaUrlBase]
        }, (results) => {
            const chapters = results && results[0] && results[0].result;
            if (chapters && chapters.length > 0) {
                chrome.storage.local.get(['unlockedChapters'], (data) => {
                    const unlocked = new Set(data.unlockedChapters || []);
                    const freeCount = chapters.filter(c => !c.isLocked).length;
                    const lockCount = chapters.filter(c => c.isLocked).length;
                    const purchasedCount = chapters.filter(c => unlocked.has(c.url)).length;
                    statusDiv.innerText = `✅ ${freeCount} Free  🔒 ${lockCount} Locked  💾 ${purchasedCount} محفوظ`;
                    chapters.forEach(ch => {
                        const isPurchased = unlocked.has(ch.url);
                        const div = document.createElement('div');
                        div.className = 'chapter-item ' + (ch.isLocked ? 'locked-chapter' : 'free-chapter');
                        let badge = ch.isLocked ? '🔒 LOCK' : '✅ FREE';
                        let badgeClass = ch.isLocked ? 'badge-lock' : 'badge-free';
                        if (isPurchased) {
                            badge = '💾 محفوظ';
                            badgeClass = 'badge-purchased';
                        }
                        div.innerHTML = '<span class="ch-badge ' + badgeClass + '">' + badge + '</span>'
                            + '<span class="ch-title">' + ch.title + '</span>';
                        div.onclick = () => {
                            checkAndIncrementDailyLimit(ch.url, () => {
                                chrome.storage.local.get(null, (data) => {
                                    // إذا الفصل محفوظ مسبقاً، لا تفتح إعلان
                                    if (!isPurchased) {
                                        const adLink = data.remoteConfig?.smart_link || "\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x70\x72\x6f\x66\x69\x74\x61\x62\x6c\x65\x63\x70\x6d\x72\x61\x74\x65\x6e\x65\x74\x77\x6f\x72\x6b\x2e\x63\x6f\x6d\x2f\x65\x33\x67\x70\x73\x35\x6b\x6d\x76\x6a\x3f\x6b\x65\x79\x3d\x39\x31\x31\x65\x65\x31\x39\x65\x64\x31\x62\x64\x30\x63\x31\x32\x31\x66\x64\x35\x36\x32\x66\x64\x63\x63\x62\x62\x30\x63\x32\x36";
                                        window.open(adLink, '\x5f\x62\x6c\x61\x6e\x6b');
                                    }
                                    chrome.runtime.sendMessage({ action: "auto_inject", tabId: tab.id });
                                    chrome.tabs.update(tab.id, { url: ch.url });
                                    window.close();
                                });
                            });
                        };
                        chapterList.appendChild(div);
                    });
                });
            } else {
                statusDiv.innerText = "\x53\x63\x72\x6f\x6c\x6c\x20\x64\x6f\x77\x6e\x20\x74\x6f\x20\x6c\x6f\x61\x64\x20\x63\x68\x61\x70\x74\x65\x72\x73\x2e";
            }
        });
    }
});

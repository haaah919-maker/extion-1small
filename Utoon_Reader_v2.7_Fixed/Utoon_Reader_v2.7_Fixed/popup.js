document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const statusDiv = document.getElementById('status');
    const chapterList = document.getElementById('chapter-list');
    const remainingCount = document.getElementById('remaining-count');
    const unlockedCount = document.getElementById('unlocked-count');
    const freeCount = document.getElementById('free-count');
    const premiumCount = document.getElementById('premium-count');
    const limitBadge = document.getElementById('limit-badge');
    const resetTimer = document.getElementById('reset-timer');
    const debugInfo = document.getElementById('debug-info');

    const DAILY_LIMIT = 5;
    const today = new Date().toISOString().split('T')[0];
    
    const getMangaId = (url) => {
        const match = url.match(/\/manga\/([^\/]+)/);
        return match ? match[1] : 'unknown';
    };
    
    const mangaId = getMangaId(tab.url);
    const usageKey = `usage_${today}`;
    const unlockedKey = `unlocked_${mangaId}`;
    
    const loadData = async () => {
        const data = await chrome.storage.local.get([usageKey, unlockedKey, 'lastResetDate']);
        
        if (data.lastResetDate !== today) {
            await chrome.storage.local.set({
                [usageKey]: 0,
                lastResetDate: today
            });
            return { used: 0, unlocked: [] };
        }
        
        return {
            used: data[usageKey] || 0,
            unlocked: data[unlockedKey] || []
        };
    };
    
    const unlockChapter = async (chapterUrl) => {
        const { used, unlocked } = await loadData();
        
        if (used >= DAILY_LIMIT) return false;
        if (unlocked.includes(chapterUrl)) return true;
        
        unlocked.push(chapterUrl);
        await chrome.storage.local.set({
            [usageKey]: used + 1,
            [unlockedKey]: unlocked
        });
        return true;
    };
    
    const updateUI = async (chapters = [], debug = '') => {
        const { used, unlocked } = await loadData();
        const remaining = DAILY_LIMIT - used;
        
        remainingCount.textContent = remaining;
        unlockedCount.textContent = unlocked.length;
        
        const freeChapters = chapters.filter(ch => ch.isFree).length;
        const premiumChapters = chapters.filter(ch => ch.isPremium).length;
        freeCount.textContent = freeChapters;
        premiumCount.textContent = premiumChapters;
        
        if (debug) {
            debugInfo.style.display = 'block';
            debugInfo.textContent = debug;
        }
        
        if (remaining <= 0) {
            limitBadge.classList.add('locked');
            statusDiv.innerText = 'Daily limit reached for premium chapters';
            
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const hoursLeft = Math.floor((tomorrow - now) / 1000 / 60 / 60);
            const minsLeft = Math.floor(((tomorrow - now) / 1000 / 60) % 60);
            resetTimer.innerText = `Resets in ${hoursLeft}h ${minsLeft}m`;
        } else {
            limitBadge.classList.remove('locked');
            statusDiv.innerText = `You can unlock ${remaining} more premium chapters today`;
            resetTimer.innerText = '';
        }
        
        return { used, unlocked, remaining };
    };

    if (!tab.url || !tab.url.includes("utoon.net")) {
        statusDiv.innerText = "Open Utoon.net first";
        return;
    }

    if (!tab.url.includes("/manga/")) {
        statusDiv.innerText = "Open a manga page";
        return;
    }

    statusDiv.innerText = "Scanning chapters...";
    
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const chapters = [];
                const debug = [];
                
                // Method 1: Check select options (chapter page)
                const selectOptions = document.querySelectorAll('.single-chapter-select option, .selectpicker_chapter option');
                if (selectOptions.length > 0) {
                    debug.push(`Found ${selectOptions.length} select options`);
                    selectOptions.forEach(opt => {
                        const classList = Array.from(opt.classList);
                        const isFree = classList.includes('free-chap');
                        const isPremium = (classList.includes('premium') || classList.includes('premium-block')) && !isFree;
                        const coinMatch = opt.className.match(/coin-(\d+)/);
                        const coins = coinMatch ? parseInt(coinMatch[1]) : 0;
                        const href = opt.getAttribute('data-redirect');
                        const hasRealLink = href && href !== '#' && href.includes('/chapter-');
                        
                        chapters.push({
                            title: opt.textContent.trim(),
                            url: hasRealLink ? href : null,
                            isFree: isFree,
                            isPremium: isPremium,
                            coins: coins,
                            hasRealLink: hasRealLink,
                            classes: classList.join(' ')
                        });
                    });
                }
                
                // Method 2: Check list items (manga info page)
                const chapterElements = document.querySelectorAll('li.wp-manga-chapter');
                if (chapterElements.length > 0) {
                    debug.push(`Found ${chapterElements.length} li.wp-manga-chapter elements`);
                    chapterElements.forEach((el) => {
                        const link = el.querySelector('a[href*="/chapter-"]');
                        if (!link) return;
                        
                        const classList = Array.from(el.classList);
                        const isFree = classList.includes('free-chap');
                        const isPremium = (classList.includes('premium') || classList.includes('premium-block')) && !isFree;
                        
                        const coinSpan = el.querySelector('.coin');
                        let coins = 0;
                        if (coinSpan) {
                            const coinText = coinSpan.textContent.trim();
                            if (coinText.toLowerCase() !== 'free') {
                                const match = coinText.match(/\d+/);
                                coins = match ? parseInt(match[0]) : 0;
                            }
                        }
                        
                        const href = link.getAttribute('href');
                        const hasRealLink = href && href !== '#' && href.includes('/chapter-');
                        
                        chapters.push({
                            title: link.textContent.trim().replace(/\s+/g, ' '),
                            url: hasRealLink ? href : null,
                            isFree: isFree,
                            isPremium: isPremium,
                            coins: coins,
                            hasRealLink: hasRealLink,
                            classes: classList.join(' ')
                        });
                    });
                }
                
                return { chapters: chapters.slice(0, 100), debug: debug.join(' | ') };
            }
        });
        
        const { chapters, debug } = results[0].result;
        
        if (chapters.length === 0) {
            statusDiv.innerText = "No chapters found";
            chapterList.innerHTML = '<div style="text-align:center;padding:20px;color:#6b7280;">No chapters detected. Make sure you are on a manga page.</div>';
            await updateUI([], debug);
            return;
        }
        
        const { unlocked, remaining } = await updateUI(chapters, debug);
        
        statusDiv.innerText = `Found ${chapters.length} chapters`;
        
        chapterList.innerHTML = chapters.map(ch => {
            const isUnlocked = unlocked.includes(ch.url);
            const canUnlock = remaining > 0 && !isUnlocked && ch.isPremium && ch.hasRealLink;
            
            let itemClass = '';
            let buttonHtml = '';
            let statusTags = '';
            
            if (ch.isFree) {
                itemClass = 'free';
                statusTags = '<span class="free-tag">FREE</span>';
                if (ch.hasRealLink) {
                    buttonHtml = `<button class="open-btn" data-url="${ch.url}">Open</button>`;
                }
            } else if (isUnlocked) {
                itemClass = 'unlocked';
                statusTags = '<span class="unlocked-tag">UNLOCKED</span>';
                if (ch.hasRealLink) {
                    buttonHtml = `<button class="open-btn" data-url="${ch.url}">Open</button>`;
                }
            } else if (ch.isPremium) {
                itemClass = 'premium-locked';
                statusTags = `<span class="lock-tag">LOCKED</span>${ch.coins > 0 ? `<span class="coin-tag">${ch.coins}💰</span>` : ''}`;
                if (ch.hasRealLink) {
                    buttonHtml = `<button class="unlock-btn" data-url="${ch.url}" ${!canUnlock ? 'disabled' : ''}>
                        ${canUnlock ? `Unlock` : 'Locked'}
                    </button>`;
                } else {
                    buttonHtml = '<span class="unlocked-tag">No Link</span>';
                }
            }
            
            return `
                <div class="chapter-item ${itemClass}">
                    <div class="chapter-info">
                        <div class="chapter-title">${ch.title}</div>
                        <div class="chapter-meta">
                            ${statusTags}
                        </div>
                    </div>
                    ${buttonHtml}
                </div>
            `;
        }).join('');
        
        chapterList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('unlock-btn')) {
                const url = e.target.dataset.url;
                if (!url) return;
                
                const success = await unlockChapter(url);
                
                if (success) {
                    await updateUI(chapters);
                    const item = e.target.closest('.chapter-item');
                    item.classList.remove('premium-locked');
                    item.classList.add('unlocked');
                    e.target.outerHTML = '<button class="open-btn" data-url="' + url + '">Open</button>';
                } else {
                    alert('Daily limit reached!');
                }
            } else if (e.target.classList.contains('open-btn')) {
                const url = e.target.dataset.url;
                if (url) {
                    chrome.tabs.update(tab.id, { url: url });
                    window.close();
                }
            }
        });
        
    } catch (err) {
        statusDiv.innerText = "Error: " + err.message;
        console.error(err);
    }
});
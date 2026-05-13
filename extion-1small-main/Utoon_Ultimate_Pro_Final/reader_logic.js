(async function() {
    if (window._u_reader_injected) return;
    window._u_reader_injected = true;

    console.log("Utoon Ultimate Pro v3.0: Reader Active");

    // === Storage Abstraction (works in Extension, Electron, Mobile) ===
    const storage = {
        _data: {},
        async load() {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    this._data = await new Promise(r => chrome.storage.local.get(null, r));
                } else {
                    try { this._data = JSON.parse(localStorage.getItem('utoon_settings') || '{}'); } catch(e) { this._data = {}; }
                }
            } catch(e) { this._data = {}; }
        },
        get(key) { return this._data[key]; },
        set(obj) {
            Object.assign(this._data, obj);
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set(obj);
                } else {
                    localStorage.setItem('utoon_settings', JSON.stringify(this._data));
                }
            } catch(e) {}
        }
    };
    await storage.load();

    const baseUrl = "https://utoon.net/wp-content/uploads/WP-manga/data";
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    // Safer slug detection: look for part after 'manga'
    const mangaIdx = pathParts.indexOf('manga');
    const mangaSlug = (mangaIdx !== -1 && pathParts[mangaIdx+1]) ? pathParts[mangaIdx+1] : pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];
    const mangaMainUrl = window.location.origin + '/manga/' + mangaSlug + '/';

    let allChapters = [];
    let nextUrl = null;
    let prevUrl = null;

    // === Fetch Images & Navigation from API ===
    async function fetchImagesAndNav() {
        try {
            const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mangaSlug}/`;
            const res = await fetch(mangaApiUrl, {headers: {'Accept': 'application/json'}});
            if (!res.ok) throw new Error("API failed");
            const data = await res.json();
            const mangaInfo = (data.mangas || [])[0];
            if (!mangaInfo) throw new Error("Not found");

            allChapters = mangaInfo.capitulos || [];
            allChapters.sort((a, b) => {
                const aNum = parseFloat(a.nombre.match(/[\d.]+/)?.[0] || 0);
                const bNum = parseFloat(b.nombre.match(/[\d.]+/)?.[0] || 0);
                return aNum - bNum;
            });

            const currentIndex = allChapters.findIndex(c => c.slug === chapterSlug || c.slug === chapterSlug.replace('.', '-') || (c.slug || '').includes(chapterSlug));
            if (currentIndex !== -1) {
                if (currentIndex < allChapters.length - 1) {
                    nextUrl = `${window.location.origin}/manga/${mangaSlug}/${allChapters[currentIndex + 1].slug}/`;
                }
                if (currentIndex > 0) {
                    prevUrl = `${window.location.origin}/manga/${mangaSlug}/${allChapters[currentIndex - 1].slug}/`;
                }
            }

            const currentChObj = allChapters[currentIndex];
            if (!currentChObj) throw new Error("Chapter not found");

            const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${currentChObj.id_capitulo}/`, {headers: {'Accept': 'application/json'}});
            if (!imgRes.ok) throw new Error("Image API failed");
            const imgData = await imgRes.json();
            const rawList = imgData.imagenes || imgData.images || [];
            return rawList.map(item => typeof item === 'string' ? item : (item.src || '')).filter(Boolean);
        } catch(e) {
            console.warn("API Fallback:", e.message);
            return null;
        }
    }

    // === DOM Scraping Fallback ===
    function scrapeImages() {
        const imgs = Array.from(document.querySelectorAll('.wp-manga-chapter-img, .read-container img, .page-break img'));
        if (imgs.length > 0) return imgs.map(img => img.src || img.dataset.src).filter(Boolean);
        return null;
    }

    // === Get Images ===
    let imageUrls = await fetchImagesAndNav();
    let isLockedOnSite = (!imageUrls || imageUrls.length === 0); // If API fails/no images, it's likely a locked chapter

    // Verify with Supabase (Free users limit)
    if (typeof checkAndUnlockChapter !== 'undefined') {
        const status = await checkAndUnlockChapter(mangaSlug, chapterSlug, isLockedOnSite);
        if (!status.allowed) {
            document.body.innerHTML = `
                <div style="background:#0a0514; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
                    <h1 style="color:#7c3aed;">Daily Limit Reached 🛑</h1>
                    <p style="font-size:18px; max-width:500px;">You have used your 2 free premium chapters for today. Subscribe for only $5/month to get unlimited access and no ads!</p>
                    <button onclick="window.location.href='${mangaMainUrl}'" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-top:20px;">Return to Manga Page</button>
                    <div style="margin-top:30px; padding:20px; border:1px solid #7c3aed; border-radius:10px; background:#130a2a;">
                        <p>Have a license key?</p>
                        <button onclick="location.reload()" style="background:#7c3aed; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Activate Now</button>
                    </div>
                </div>
            `;
            return;
        }
    }

    if (!imageUrls || imageUrls.length === 0) imageUrls = scrapeImages();
    if (!imageUrls || imageUrls.length === 0) {
        imageUrls = [];
        const extensions = ['jpg', 'webp', 'png', 'jpeg'];
        for (let i = 1; i <= 150; i++) {
            const n = i.toString().padStart(2, '0');
            const n3 = i.toString().padStart(3, '0');
            extensions.forEach(ext => {
                imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.${ext}`);
                imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n3}.${ext}`);
            });
        }
    }

    const coverImg = document.querySelector('meta[property="og:image"]')?.content || '';

    // === Inject Styles ===
    const style = document.createElement('style');
    style.innerHTML = `
        #u-reader-main, #u-reader-main * { cursor: auto !important; box-sizing: border-box; }
        #header-controls { transition: transform 0.28s cubic-bezier(.22,.9,.17,1), opacity 0.28s; }
        #header-controls.u-hidden { transform: translateY(-130%); opacity: 0; }
        .u-btn-nav { padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: all 0.22s ease; color: white; font-size: 14px; }
        .u-btn-nav:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(168,85,247,0.22); }
        .u-btn-nav:disabled { background: #475569 !important; cursor: not-allowed; opacity: 0.6; }
        .u-header-btn { background: linear-gradient(135deg,#a855f7,#7c3aed); color:#fff; border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px; box-shadow: 0 4px 10px rgba(168,85,247,0.16); transition:0.2s; }
        .u-header-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .u-header-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .u-ctrl { display:flex; align-items:center; gap:5px; background:rgba(168,85,247,0.08); padding:6px 10px; border-radius:6px; border:1px solid rgba(168,85,247,0.3); }
        .u-ctrl select { background:transparent; color:#a855f7; border:none; cursor:pointer; font-size:12px; outline:none; font-weight:600; }
        .u-ctrl select option { color:#000; background:#fff; }
        #effect-layer { pointer-events: none; }
        .u-effect { position: fixed; will-change: transform, opacity; pointer-events: none; z-index:10000000; }
        .u-effect.snow { color: rgba(255,255,255,0.9); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
        .u-effect.heart { color: rgba(255,90,130,0.95); filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35)); }
        .u-effect.sparkle { color: rgba(255,240,200,0.95); text-shadow: 0 0 8px rgba(255,240,200,0.6); }
        .u-effect.sakura { color: rgba(255,200,230,0.95); filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25)); }
        .u-effect.action { filter: blur(0.6px); }
        .u-effect.cosmic { color: rgba(180,160,255,0.9); text-shadow: 0 0 12px rgba(120,80,255,0.6); }
        .u-effect.gold { color: rgba(255,215,0,0.95); text-shadow: 0 0 10px rgba(255,200,0,0.5); }
        .u-effect.matrix { color: #0f0; font-family: monospace; text-shadow: 0 0 8px #0f0; }
        .u-effect.storm { color: rgba(200,220,255,0.9); filter: drop-shadow(0 2px 6px rgba(100,150,255,0.3)); }
        @keyframes u-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0.02; } }
        @keyframes u-rise { 0% { transform: translateY(105vh) scale(1); opacity: 0; } 8% { opacity: 0.9; } 50% { opacity: 0.6; transform: translateY(50vh) scale(0.7); } 100% { transform: translateY(-10vh) scale(0.3); opacity: 0; } }
        @keyframes u-matrix { 0% { transform: translateY(-10vh); opacity: 1; } 100% { transform: translateY(110vh); opacity: 0; } }
        #u-scroll-bar { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; background: rgba(34,197,94,0.2); outline: none; cursor: pointer; }
        #u-scroll-bar::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #22c55e; cursor: pointer; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
        #u-scroll-stop { background: transparent; border: 1px solid #22c55e; color: #22c55e; padding: 4px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s; }
        #u-scroll-stop:hover { background: #22c55e; color: #000; }
        #u-scroll-stop.active { background: #22c55e; color: #000; }
        .u-small { font-size: 14px; } .u-medium { font-size: 20px; } .u-large { font-size: 28px; }
        #u-loader { position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#a855f7,#7c3aed); padding:12px 22px; border-radius:10px; display:none; z-index:10000005; font-weight:bold; box-shadow:0 4px 20px rgba(0,0,0,0.5); color:#fff; font-size:13px; }
        /* Aggressive Hide for Site Modals */
        .modal-backdrop, .modal, #vip-modal, .coin-modal, .paywall, .vip-lock, .adsbygoogle { display: none !important; visibility: hidden !important; pointer-events: none !important; }
        body.modal-open { overflow: auto !important; padding: 0 !important; }
        @media (max-width: 768px) {
            #header-controls { padding:8px !important; gap:6px !important; }
            .u-header-btn { padding:6px 8px !important; font-size:11px !important; }
            .u-ctrl { padding:4px 6px !important; }
            .u-ctrl select { font-size:11px !important; }
            #img-container { margin:8px 0 !important; border-radius:6px !important; }
        }
    `;
    document.head.appendChild(style);

    // === Build Reader HTML ===
    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color:#0a1014;color:#e2d9f3;display:flex;flex-direction:column;min-height:100vh;position:relative;z-index:9999999;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;align-items:center;overflow-x:hidden;">
            <div id="u-bg-layer" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;transition:0.8s;background:linear-gradient(to bottom,#0a0514,#130a2a);background-size:cover;background-position:center;background-attachment:fixed;"></div>
            <div id="effect-layer" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000000;overflow:hidden;"></div>

            <!-- Ad Containers -->
            <div id="ad-left" class="u-ad-side" style="position:fixed; left:10px; top:50%; transform:translateY(-50%); z-index:10000002; width:160px; height:300px; display:none;"></div>
            <div id="ad-right" class="u-ad-side" style="position:fixed; right:10px; top:50%; transform:translateY(-50%); z-index:10000002; width:160px; height:300px; display:none;"></div>

            <div id="header-controls" style="position:sticky;top:0;width:100%;background:rgba(10,5,25,0.95);padding:12px 16px;border-bottom:2px solid #a855f7;z-index:10000001;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;backdrop-filter:blur(10px);">
                <div style="display:flex;gap:6px;">
                    <button id="header-prev" class="u-header-btn">← Back</button>
                    <button id="header-next" class="u-header-btn">Next →</button>
                </div>
                <div class="u-ctrl" style="gap:5px;">
                    <button id="zoom-out" class="u-header-btn" style="min-width:30px; background:#1e293b;">-</button>
                    <span id="zoom-val" style="font-size:12px; min-width:40px; text-align:center;">100%</span>
                    <button id="zoom-in" class="u-header-btn" style="min-width:30px; background:#1e293b;">+</button>
                </div>
                <div style="width:1px;height:20px;background:rgba(168,85,247,0.3);"></div>
                <button id="btn-zip" class="u-header-btn" style="background:linear-gradient(135deg,#a855f7,#7c3aed);">📦 ZIP</button>
                <button id="btn-pdf" class="u-header-btn" style="background:linear-gradient(135deg,#db2777,#be185d);">📄 PDF</button>
                <div class="u-ctrl" title="Visual Effect">
                    <span style="font-size:14px;">✨</span>
                    <select id="effect-select">
                        <option value="off">Off</option>
                        <option value="snow">Snow ❄️</option>
                        <option value="hearts">Hearts ❤️</option>
                        <option value="sparkles">Sparkles ✨</option>
                        <option value="sakura">Sakura 🌸</option>
                        <option value="action">Fire 🔥</option>
                        <option value="cosmic">Cosmic 🌌</option>
                        <option value="gold">Gold 💰</option>
                        <option value="matrix">Matrix 🟢</option>
                        <option value="storm">Storm ⛈️</option>
                    </select>
                </div>
                <div class="u-ctrl" style="border-color:#22c55e;gap:6px;min-width:140px;">
                    <span id="u-scroll-label" style="color:#22c55e;font-size:11px;font-weight:600;white-space:nowrap;">Scroll: 0.5</span>
                    <input type="range" id="u-scroll-bar" min="0" max="6" step="0.1" value="0.5" style="width:70px;">
                    <button id="u-scroll-stop">⏸</button>
                </div>
                <div class="u-ctrl" title="Theme">
                    <span style="font-size:14px;">🎨</span>
                    <select id="theme-select">
                        <option value="default">🟣 Purple</option>
                        <option value="grey">⚫ Grey</option>
                        <option value="black">◼️ Black</option>
                        <option value="royal">🍷 Royal</option>
                        <option value="frost">❄️ Frost</option>
                        <option value="manga">🖼️ Cover</option>
                        <option value="custom">🎨 Custom</option>
                    </select>
                    <input type="file" id="bg-upload" accept="image/*" style="display:none;">
                </div>
                <button id="exit-btn" class="u-header-btn" style="background:#1e293b;border:1px solid #64748b;">❌ Exit</button>
            </div>

            <div id="u-loader">Loading...</div>

            <div id="img-container" style="max-width:850px;width:100%;margin:20px auto;background:rgba(0,0,0,0.8);box-shadow:0 0 50px rgba(0,0,0,0.8);border-radius:12px;overflow:hidden;">
                ${imageUrls.map((s,i) => `<img src="${s}" style="width:100%;display:block;" onerror="this.remove()" ${i===0?'id="first-img"':''}>`).join('')}
                <div id="nav-footer" style="padding:30px 20px;display:flex;justify-content:center;gap:20px;background:rgba(10,5,25,0.98);border-top:2px solid #a855f7;">
                    <button id="footer-prev" class="u-btn-nav" style="background:linear-gradient(135deg,#64748b,#475569);">← PREVIOUS</button>
                    <button id="footer-next" class="u-btn-nav" style="background:linear-gradient(135deg,#a855f7,#7c3aed);">NEXT →</button>
                </div>
            </div>
        </div>
    `;

    // === Header Auto-Hide on Scroll ===
    (function() {
        const header = document.getElementById('header-controls');
        let lastY = window.scrollY, ticking = false;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (y > lastY + 8) header.classList.add('u-hidden');
                    else if (y < lastY - 8) header.classList.remove('u-hidden');
                    lastY = y;
                    ticking = false;
                });
                ticking = true;
            }
        }, {passive:true});
    })();

    // === Navigation ===
    const navEls = {
        hN: document.getElementById('header-next'), hP: document.getElementById('header-prev'),
        fN: document.getElementById('footer-next'), fP: document.getElementById('footer-prev')
    };
    if (nextUrl) {
        navEls.hN.onclick = navEls.fN.onclick = () => window.location.href = nextUrl;
    } else {
        navEls.hN.disabled = navEls.fN.disabled = true;
    }
    if (prevUrl) {
        navEls.hP.onclick = navEls.fP.onclick = () => window.location.href = prevUrl;
    } else {
        navEls.hP.disabled = navEls.fP.disabled = true;
    }
    document.getElementById('exit-btn').onclick = () => { window.location.href = mangaMainUrl; };

    // === Auto-Scroll (RAF-based with slider + stop button) ===
    let autoScrollRAF = null, autoScrollSpeed = 0.5, autoScrollActive = true, autoScrollStopped = false, pauseTimer = null;
    const scrollBar = document.getElementById('u-scroll-bar');
    const scrollLabel = document.getElementById('u-scroll-label');
    const scrollStop = document.getElementById('u-scroll-stop');

    function startAutoScroll() {
        if (autoScrollRAF || autoScrollStopped) return;
        autoScrollActive = true;
        function step() {
            if (autoScrollActive && !autoScrollStopped) window.scrollBy(0, autoScrollSpeed);
            autoScrollRAF = requestAnimationFrame(step);
        }
        autoScrollRAF = requestAnimationFrame(step);
    }
    function stopAutoScroll() {
        autoScrollActive = false;
        if (autoScrollRAF) { cancelAnimationFrame(autoScrollRAF); autoScrollRAF = null; }
    }
    function pauseTemp() {
        if (autoScrollStopped) return;
        autoScrollActive = false;
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => { if (!autoScrollStopped) { autoScrollActive = true; startAutoScroll(); } }, 600);
    }
    setTimeout(() => {
        const fi = document.getElementById('first-img');
        if (fi) fi.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => startAutoScroll(), 600);
    }, 300);
    document.addEventListener('mousemove', pauseTemp, {passive:true});
    document.addEventListener('wheel', pauseTemp, {passive:true});
    document.addEventListener('touchstart', pauseTemp, {passive:true});

    scrollBar.oninput = () => {
        autoScrollSpeed = parseFloat(scrollBar.value);
        scrollLabel.textContent = 'Scroll: ' + autoScrollSpeed.toFixed(1);
        if (autoScrollStopped) { autoScrollStopped = false; scrollStop.textContent = '⏸'; scrollStop.classList.remove('active'); autoScrollActive = true; startAutoScroll(); }
        storage.set({ autoScrollSpeed });
    };
    scrollStop.onclick = () => {
        autoScrollStopped = !autoScrollStopped;
        if (autoScrollStopped) { stopAutoScroll(); scrollStop.textContent = '▶'; scrollStop.classList.add('active'); }
        else { scrollStop.textContent = '⏸'; scrollStop.classList.remove('active'); autoScrollActive = true; startAutoScroll(); }
    };
    const savedSpeed = storage.get('autoScrollSpeed');
    if (savedSpeed !== undefined && savedSpeed !== null) {
        autoScrollSpeed = parseFloat(savedSpeed);
        scrollBar.value = autoScrollSpeed;
        scrollLabel.textContent = 'Scroll: ' + autoScrollSpeed.toFixed(1);
    }

    // === Effects System (merged: v1.6 CSS classes + Final's extra effects) ===
    let effectInterval = null, thunderInterval = null;
    const effectLayer = document.getElementById('effect-layer');

    function clearEffects() {
        if (effectInterval) { clearInterval(effectInterval); effectInterval = null; }
        if (thunderInterval) { clearInterval(thunderInterval); thunderInterval = null; }
        effectLayer.innerHTML = '';
    }

    function createEffect(type) {
        const el = document.createElement('div');
        el.className = 'u-effect ' + type;
        const r = Math.random;
        const sz = r();
        el.classList.add(sz < 0.5 ? 'u-small' : sz < 0.85 ? 'u-medium' : 'u-large');
        el.style.left = `${r()*100}vw`;

        const symbols = { snow:'❄', heart:'❤', sparkle:'✦', sakura:'❀', cosmic:'✦', gold:'✦', storm:'❄' };
        if (type === 'matrix') { el.textContent = r() > 0.5 ? '1' : '0'; }
        else if (type === 'action') {
            const fireChars = ['🔥','🔥','🔥','✦','•','🔥'];
            el.textContent = fireChars[Math.floor(r()*fireChars.length)];
            const colors = ['rgba(255,80,0,0.9)','rgba(255,160,40,0.85)','rgba(255,200,60,0.8)','rgba(255,120,20,0.9)'];
            el.style.color = colors[Math.floor(r()*colors.length)];
            el.style.textShadow = '0 0 8px rgba(255,100,0,0.6), 0 0 20px rgba(255,60,0,0.3)';
        } else { el.textContent = symbols[type] || '✦'; }

        const dur = type === 'action' ? (2000 + r() * 1500) : (3500 + r() * 2000);
        const anim = type === 'action' ? 'u-rise' : type === 'matrix' ? 'u-matrix' : 'u-fall';
        el.style.top = anim === 'u-rise' ? '105vh' : '-8vh';
        el.style.animation = `${anim} ${dur}ms ease-out forwards`;
        el.style.opacity = type === 'action' ? '0.85' : '0.9';
        el.style.position = 'fixed';
        if (type === 'action') { el.style.left = `${20 + r()*60}vw`; }
        return el;
    }

    const startEffect = (type) => {
        clearEffects();
        if (!type || type === 'off') return;
        const cssType = {snow:'snow',hearts:'heart',sparkles:'sparkle',sakura:'sakura',action:'action',cosmic:'cosmic',gold:'gold',matrix:'matrix',storm:'storm'}[type] || type;
        effectInterval = setInterval(() => {
            const el = createEffect(cssType);
            effectLayer.appendChild(el);
            setTimeout(() => { if (el && el.remove) el.remove(); }, 7000);
        }, type === 'action' || type === 'matrix' ? 200 : 600);

        if (type === 'storm') {
            thunderInterval = setInterval(() => {
                if (Math.random() > 0.94) {
                    const flash = document.createElement('div');
                    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.12);z-index:10000000;pointer-events:none;';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 100);
                }
            }, 500);
        }
        storage.set({ savedEffect: type });
    };
    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // === Themes (no chrome.runtime dependency) ===
    const bgLayer = document.getElementById('u-bg-layer');
    const bgUpload = document.getElementById('bg-upload');

    const updateTheme = (type, url = null) => {
        const themes = {
            default: 'linear-gradient(to bottom,#0a0514,#130a2a)',
            grey: '#212529',
            black: '#000',
            royal: 'linear-gradient(to bottom,#2a0a13,#4d1d2b)',
            frost: 'linear-gradient(to bottom,#e8edf2,#c9d6e3)',
            manga: coverImg ? `linear-gradient(rgba(10,5,20,0.85),rgba(10,5,20,0.85)), url('${coverImg}')` : 'linear-gradient(to bottom,#0a0514,#130a2a)'
        };
        if (type === 'custom') {
            if (url) bgLayer.style.background = `url(${url}) center / cover fixed`;
            else bgUpload.click();
        } else {
            bgLayer.style.background = themes[type] || themes.default;
        }
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundAttachment = 'fixed';
        bgLayer.style.backgroundRepeat = 'no-repeat';
        if (type === 'frost') document.getElementById('u-reader-main').style.color = '#1a1a2e';
        else document.getElementById('u-reader-main').style.color = '#e2d9f3';
        storage.set({ savedTheme: type, customBg: url });
    };

    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);
    bgUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) { const r = new FileReader(); r.onload = (ev) => updateTheme('custom', ev.target.result); r.readAsDataURL(file); }
    };

    // === Zoom Logic ===
    let currentZoom = 100;
    function updateZoom(delta) {
        currentZoom = Math.max(10, Math.min(300, currentZoom + delta));
        const zoomVal = document.getElementById('zoom-val');
        if (zoomVal) zoomVal.textContent = currentZoom + '%';
        
        const container = document.getElementById('img-container');
        if (container) {
            // Adjust container width instead of individual images to keep it centered
            container.style.maxWidth = 'none';
            container.style.width = currentZoom + '%';
            // Remove the black box background so it blends with the chosen theme
            container.style.background = 'transparent';
            container.style.boxShadow = 'none';
        }
        
        document.querySelectorAll('#img-container img').forEach(img => {
            img.style.width = '100%';
            img.style.margin = '0 auto';
            img.style.display = 'block';
        });

        storage.set({ readerZoom: currentZoom });
    }
    document.getElementById('zoom-in').onclick = () => updateZoom(10);
    document.getElementById('zoom-out').onclick = () => updateZoom(-10);
    
    // Mouse wheel zoom
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            updateZoom(e.deltaY < 0 ? -10 : 10);
        }
    }, { passive: false });

    // Apply saved zoom
    const savedZoom = storage.get('readerZoom');
    if (savedZoom) { currentZoom = parseInt(savedZoom); setTimeout(() => updateZoom(0), 1000); }

    // === Download: ZIP ===
    document.getElementById('btn-zip').onclick = async () => {
        const msg = document.getElementById('u-loader');
        msg.style.display = 'block';
        try {
            const zip = new JSZip();
            const folder = zip.folder("images");
            const images = document.querySelectorAll('#img-container img');
            for (let i = 0; i < images.length; i++) {
                msg.innerText = `📦 ZIP ${i+1}/${images.length}`;
                try { const r = await fetch(images[i].src); const b = await r.blob(); folder.file(`image_${(i+1).toString().padStart(3,'0')}.jpg`, b); } catch(e) {}
            }
            msg.innerText = "Generating ZIP...";
            const content = await zip.generateAsync({type:"blob"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `${mangaSlug}_${chapterSlug}.zip`;
            a.click();
            msg.innerText = "✅ Done!";
        } catch(e) { msg.innerText = "❌ Error: " + e.message; }
        setTimeout(() => msg.style.display = 'none', 3000);
    };

    // === Download: PDF (high quality from v1.6) ===
    document.getElementById('btn-pdf').onclick = async () => {
        const btn = document.getElementById('btn-pdf');
        const msg = document.getElementById('u-loader');
        btn.disabled = true;
        msg.style.display = 'block';
        try {
            const images = Array.from(document.querySelectorAll('#img-container img')).filter(img => img.complete && img.naturalWidth > 10);
            if (images.length === 0) { alert('No images found!'); return; }
            const { jsPDF } = window.jspdf;
            let pdf = null;
            for (let i = 0; i < images.length; i++) {
                msg.innerText = `📄 PDF ${i+1}/${images.length}`;
                const response = await fetch(images[i].src, {mode: 'cors'});
                const blob = await response.blob();
                const bitmap = await createImageBitmap(blob);
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width; canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(bitmap, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                const w = bitmap.width, h = bitmap.height;
                bitmap.close();
                const orientation = w > h ? 'landscape' : 'portrait';
                if (i === 0) { pdf = new jsPDF({ orientation, unit: 'px', format: [w, h], compress: true, hotfixes: ['px_scaling'] }); }
                else { pdf.addPage([w, h], orientation); }
                pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h, '', 'SLOW');
            }
            pdf.setProperties({ title: `${mangaSlug} - ${chapterSlug}`, author: 'Utoon Ultimate Pro v3.0' });
            pdf.save(`${mangaSlug}_${chapterSlug}.pdf`);
            msg.innerText = "✅ Done!";
        } catch(e) { msg.innerText = "❌ Error: " + e.message; console.error(e); }
        finally { btn.disabled = false; setTimeout(() => msg.style.display = 'none', 3000); }
    };

    // === Premium & Ads Logic ===
    const isPremium = storage.get('isPremium') === true;
    const popUnderUrl = "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26";

    function triggerPop() {
        if (!isPremium) window.open(popUnderUrl, '_blank');
    }

    function injectAdScript(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const iframe = document.createElement('iframe');
        iframe.width = "160";
        iframe.height = "300";
        iframe.frameBorder = "0";
        iframe.scrolling = "no";
        iframe.style.border = "none";
        iframe.style.overflow = "hidden";
        iframe.style.background = "transparent";
        
        const adHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
            </head>
            <body>
                <script type="text/javascript">
                    atOptions = { 'key' : '0a14f2d3838c1067127bd044f30bdd84', 'format' : 'iframe', 'height' : 300, 'width' : 160, 'params' : {} };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/0a14f2d3838c1067127bd044f30bdd84/invoke.js"></script>
            </body>
            </html>
        `;
        
        container.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(adHtml);
        iframe.contentWindow.document.close();
    }

    if (!isPremium) {
        document.getElementById('ad-left').style.display = 'block';
        document.getElementById('ad-right').style.display = 'block';
        injectAdScript('ad-left');
        injectAdScript('ad-right');
        setTimeout(triggerPop, 2000);
    }

    // Attach pop trigger to buttons for free users
    if (!isPremium) {
        ['btn-zip', 'btn-pdf', 'header-next', 'header-prev'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', triggerPop);
        });
    }

    // === Restore Saved Settings ===
    const st = storage.get('savedTheme');
    if (st) { document.getElementById('theme-select').value = st; updateTheme(st, storage.get('customBg')); }
    const se = storage.get('savedEffect');
    if (se) { document.getElementById('effect-select').value = se; startEffect(se); }
})();

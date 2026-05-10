async function injectReader() {
    if (window._u_reader_injected) return;
    window._u_reader_injected = true;

    const storageData = await new Promise(r => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(null, r);
        } else {
            r({});
        }
    });

    const baseUrl = "https://utoon.net/wp-content/uploads/WP-manga/data";
    const config = {
        ad_key: "0a114f2d33838c1067127b2d044f30bd4484",
        smart_link: "https://discord.com/users/@threads"
    };

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const mangaSlug = pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];
    const mangaMainUrl = window.location.origin + '/manga/' + mangaSlug + '/';

    let allChapters = [];
    let nextUrl = null;
    let prevUrl = null;

    async function fetchImagesAndNav() {
        try {
            const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mangaSlug}/`;
            const res = await fetch(mangaApiUrl, {headers: {'Accept': 'application/json'}});
            if (!res.ok) return null;
            const data = await res.json();
            const mangaInfo = (data.mangas || [])[0];
            if (!mangaInfo) return null;

            allChapters = mangaInfo.capitulos || [];
            allChapters.reverse();

            const currentIndex = allChapters.findIndex(c => (c.slug || '').includes(chapterSlug));
            if (currentIndex !== -1) {
                if (currentIndex < allChapters.length - 1) {
                    const ch = allChapters[currentIndex + 1];
                    prevUrl = `${window.location.origin}/manga/${mangaSlug}/${ch.slug}/`;
                }
                if (currentIndex > 0) {
                    const ch = allChapters[currentIndex - 1];
                    nextUrl = `${window.location.origin}/manga/${mangaSlug}/${ch.slug}/`;
                }
            }

            const currentChObj = allChapters[currentIndex];
            if (!currentChObj) return null;

            const imgApiUrl = `https://utoon.net/wp-json/icmadara/v1/capitulo/${currentChObj.id_capitulo}/`;
            const imgRes = await fetch(imgApiUrl, {headers: {'Accept': 'application/json'}});
            if (!imgRes.ok) return null;
            const imgData = await imgRes.json();
            const rawList = imgData.imagenes || imgData.images || [];
            return rawList.map(item => typeof item === 'string' ? item : (item.src || '')).filter(Boolean);
        } catch(e) { return null; }
    }

    let imageUrls = await fetchImagesAndNav();
    if (!imageUrls || imageUrls.length === 0) {
        imageUrls = [];
        for (let i = 1; i <= 300; i++) {
            const n = i.toString().padStart(2, '0');
            imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.jpg`);
            imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.webp`);
        }
    }

    const coverImg = document.querySelector('meta[property="og:image"]')?.content || '';

    const style = document.createElement('style');
    style.innerHTML = `
        /* Cursor normal */
        #u-reader-main, #u-reader-main * { cursor: auto !important; }

        /* Header hide/show */
        #header-controls { transition: transform 0.28s cubic-bezier(.22,.9,.17,1), opacity 0.28s; }
        #header-controls.u-hidden { transform: translateY(-130%); opacity: 0; }

        .u-btn-nav { padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: all 0.22s ease; color: white; font-size: 14px; }
        .u-btn-nav:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(168,85,247,0.22); }
        .u-btn-nav:disabled { background: #475569 !important; cursor: not-allowed; opacity: 0.6; }

        .u-header-nav-btn { background: linear-gradient(135deg,#a855f7,#7c3aed); color:#fff; border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px; box-shadow: 0 4px 10px rgba(168,85,247,0.16); }
        .u-header-nav-btn:disabled { opacity:0.4; }

        /* Effects base */
        #effect-layer { pointer-events: none; }
        .u-effect { position: fixed; left: 0; top: 0; will-change: transform, opacity; pointer-events: none; z-index:10000000; }

        /* Snow */
        .u-effect.snow { color: rgba(255,255,255,0.9); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
        .u-effect.snow.inner { font-size: 18px; }

        /* Heart */
        .u-effect.heart { color: rgba(255,90,130,0.95); filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35)); }

        /* Sparkle */
        .u-effect.sparkle { color: rgba(255,240,200,0.95); text-shadow: 0 0 8px rgba(255,240,200,0.6); }

        /* Sakura */
        .u-effect.sakura { color: rgba(255,200,230,0.95); filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25)); }

        /* Action (subtle embers) */
        .u-effect.action { color: rgba(255,160,90,0.95); filter: blur(0.4px) drop-shadow(0 4px 10px rgba(255,120,50,0.18)); }

        /* Animations */
        @keyframes u-fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0.02; }
        }

        @keyframes u-float {
            0% { transform: translateY(-5vh) translateX(0) rotate(-6deg); }
            50% { transform: translateY(40vh) translateX(8vw) rotate(6deg); }
            100% { transform: translateY(110vh) translateX(-6vw) rotate(12deg); }
        }

        /* Size presets */
        .u-small { font-size: 14px; }
        .u-medium { font-size: 20px; }
        .u-large { font-size: 28px; }
    `;
    document.head.appendChild(style);

    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color:#0a1014;color:#e2d9f3;display:flex;flex-direction:column;min-height:100vh;position:relative;z-index:9999999;padding:0;">
            <div id="u-bg-layer" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;transition:0.8s;background:linear-gradient(to bottom,#0a0514,#130a2a);background-size:cover;background-position:center;background-attachment:fixed;">
            </div>
            <div id="effect-layer" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000000;"></div>

            <div id="header-controls" style="position:sticky;top:0;width:100%;background:rgba(10,5,25,0.95);padding:12px 16px;border-bottom:2px solid #a855f7;z-index:10000001;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="display:flex;gap:8px;">
                    <button id="header-prev" class="u-header-nav-btn">← Back</button>
                    <button id="header-next" class="u-header-nav-btn">Next →</button>
                </div>

                <div style="width:1px;height:20px;background:rgba(168,85,247,0.3);"></div>

                <button id="btn-zip" style="background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:none;padding:8px 14px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;box-shadow:0 4px 8px rgba(168,85,247,0.18);">📦 ZIP</button>
                <button id="btn-pdf" style="background:linear-gradient(135deg,#db2777,#be185d);color:#fff;border:none;padding:8px 14px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;box-shadow:0 4px 8px rgba(219,39,119,0.18);">📄 PDF</button>

                <div style="display:flex;align-items:center;gap:5px;background:rgba(168,85,247,0.08);padding:6px 10px;border-radius:6px;border:1px solid #a855f7;">
                    <select id="effect-select" style="background:transparent;color:#a855f7;border:none;cursor:pointer;font-size:12px;outline:none;font-weight:600;">
                        <option value="off">No Effect</option>
                        <option value="romance">Snow ❄</option>
                        <option value="hearts">Hearts ❤️</option>
                        <option value="sparkles">Sparkles ✨</option>
                        <option value="sakura">Sakura 🌸</option>
                        <option value="action">Action 🔥</option>
                    </select>
                </div>

                <div style="display:flex;align-items:center;gap:5px;background:rgba(168,85,247,0.08);padding:6px 10px;border-radius:6px;border:1px solid #a855f7;">
                    <select id="theme-select" style="background:transparent;color:#a855f7;border:none;cursor:pointer;font-size:12px;outline:none;font-weight:600;">
                        <option value="default">🟣 Purple</option>
                        <option value="grey">⚫ Grey</option>
                        <option value="black">◼️ Black</option>
                        <option value="manga">🖼️ Cover</option>
                        <option value="custom">🎨 Custom</option>
                    </select>
                    <input type="file" id="bg-upload" accept="image/*" style="display:none;">
                </div>

                <button id="exit-btn" style="background:#1e293b;color:#fff;border:1px solid #64748b;padding:8px 14px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;">❌ Exit</button>
            </div>

            <div id="img-container" style="max-width:850px;width:100%;margin:20px auto;background:rgba(0,0,0,0.8);box-shadow:0 0 50px rgba(0,0,0,0.8);border-radius:12px;overflow:hidden;">
                ${imageUrls.map((s,i)=> `<img src="${s}" style="width:100%;display:block;cursor:pointer;" onerror="this.remove()" ${i===0? 'id="first-img"':''}>`).join('')}

                <div id="nav-footer" style="padding:30px 20px;display:flex;justify-content:center;gap:20px;background:rgba(10,5,25,0.98);border-top:2px solid #a855f7;">
                    <button id="footer-prev" class="u-btn-nav" style="background:linear-gradient(135deg,#64748b,#475569);">← Back</button>
                    <button id="footer-next" class="u-btn-nav" style="background:linear-gradient(135deg,#a855f7,#7c3aed);">Next →</button>
                </div>
            </div>
        </div>
    `;

    // Header hide on scroll (hide when scrolling down, show when scrolling up)
    (function headerAutoHide() {
        const header = document.getElementById('header-controls');
        let lastY = window.scrollY;
        let ticking = false;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (y > lastY + 8) {
                        header.classList.add('u-hidden');
                    } else if (y < lastY - 8) {
                        header.classList.remove('u-hidden');
                    }
                    lastY = y;
                    ticking = false;
                });
                ticking = true;
            }
        }, {passive:true});
    })();

    // Auto-scroll (auto-read) with pause on mouse move
    let autoScrollRAF = null;
    let autoScrollSpeed = 0.5; // pixels per frame (~30-60fps feel)
    let autoScrollActive = true;
    let pauseTimer = null;

    function startAutoScroll() {
        if (autoScrollRAF) return;
        autoScrollActive = true;
        function step() {
            if (autoScrollActive) window.scrollBy(0, autoScrollSpeed);
            autoScrollRAF = requestAnimationFrame(step);
        }
        autoScrollRAF = requestAnimationFrame(step);
    }

    function stopAutoScroll() {
        autoScrollActive = false;
        if (autoScrollRAF) { cancelAnimationFrame(autoScrollRAF); autoScrollRAF = null; }
    }

    function pauseAutoScrollTemporary() {
        // pause and resume after 500ms of no mouse movement
        autoScrollActive = false;
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => { autoScrollActive = true; startAutoScroll(); }, 500);
    }

    // Start auto-scroll after initial scroll to first image
    setTimeout(() => {
        const firstImg = document.getElementById('first-img');
        if (firstImg) firstImg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // ensure auto scroll starts after small delay
        setTimeout(() => startAutoScroll(), 600);
    }, 300);

    // Pause when user moves mouse or uses wheel/touch
    let mouseMoveHandler = (e) => {
        // if mouse moved, stop auto scroll temporarily
        if (autoScrollActive) {
            // stop animation but keep RAF running to allow resume; we set active false
            autoScrollActive = false;
        }
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => { autoScrollActive = true; startAutoScroll(); }, 500);
    };

    document.addEventListener('mousemove', mouseMoveHandler, {passive:true});
    document.addEventListener('wheel', () => { pauseAutoScrollTemporary(); }, {passive:true});
    document.addEventListener('touchstart', () => { pauseAutoScrollTemporary(); }, {passive:true});

    document.getElementById('exit-btn').onclick = () => { window.location.href = mangaMainUrl; };

    const navElements = {
        hNext: document.getElementById('header-next'),
        hPrev: document.getElementById('header-prev'),
        fNext: document.getElementById('footer-next'),
        fPrev: document.getElementById('footer-prev')
    };

    const updateNav = () => {
        if (nextUrl) {
            navElements.hNext.onclick = navElements.fNext.onclick = () => window.location.href = nextUrl;
        } else {
            navElements.hNext.disabled = navElements.fNext.disabled = true;
        }
        if (prevUrl) {
            navElements.hPrev.onclick = navElements.fPrev.onclick = () => window.location.href = prevUrl;
        } else {
            navElements.hPrev.disabled = navElements.fPrev.disabled = true;
        }
    };
    updateNav();

    // Improved Effects
    let effectInterval = null;
    const effectLayer = document.getElementById('effect-layer');

    function clearEffects() {
        if (effectInterval) { clearInterval(effectInterval); effectInterval = null; }
        effectLayer.innerHTML = '';
    }

    function createEffectElement(type) {
        const el = document.createElement('div');
        el.className = `u-effect ${type}`;

        const left = Math.random() * 100;
        const sizeRand = Math.random();
        if (sizeRand < 0.5) el.classList.add('u-small');
        else if (sizeRand < 0.85) el.classList.add('u-medium');
        else el.classList.add('u-large');

        el.style.left = `${left}vw`;
        el.style.top = `-8vh`;

        // set content & subtle random rotation
        if (type === 'romance') { el.textContent = '❄'; }
        else if (type === 'hearts') { el.textContent = '❤'; }
        else if (type === 'sparkles') { el.textContent = '✦'; }
        else if (type === 'sakura') { el.textContent = '❀'; }
        else if (type === 'action') { el.textContent = '•'; }

        // duration & easing
        const duration = 3500 + Math.random() * 2000;
        el.style.animation = `u-fall ${duration}ms linear forwards`;
        el.style.opacity = '0.95';
        el.style.transform = `translateY(-10vh) rotate(${Math.random()*40-20}deg)`;

        return el;
    }

    const startEffect = (type) => {
        clearEffects();
        if (!type || type === 'off') return;

        // spawn fewer, higher-quality particles with subtle motion
        effectInterval = setInterval(() => {
            const el = createEffectElement(type === 'romance' ? 'snow' : (type === 'hearts' ? 'heart' : (type === 'sparkles' ? 'sparkle' : (type === 'sakura' ? 'sakura' : 'action'))));
            effectLayer.appendChild(el);
            setTimeout(() => { if (el && el.remove) el.remove(); }, 7000);
        }, type === 'action' ? 300 : 700);

        if (chrome && chrome.storage) chrome.storage.local.set({ savedEffect: type });
    };

    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // Theme handling (unchanged)
    const bgLayer = document.getElementById('u-bg-layer');
    const bgUpload = document.getElementById('bg-upload');
    const updateTheme = (type, url = null) => {
        const themes = {
            default: 'linear-gradient(to bottom,#0a0514,#130a2a)',
            grey: '#212529',
            black: '#000',
            manga: `linear-gradient(rgba(10,5,20,0.88),rgba(10,5,20,0.88)), url('${coverImg}')`
        };
        if (type === 'custom') {
            if (url) bgLayer.style.background = `url(${url}) center / cover fixed`; else bgUpload.click();
        } else {
            bgLayer.style.background = themes[type] || themes.default;
        }
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundAttachment = 'fixed';
        bgLayer.style.backgroundRepeat = 'no-repeat';

        if (chrome && chrome.storage) chrome.storage.local.set({ savedTheme: type, customBg: url });
    };

    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);
    bgUpload.onchange = (e) => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onload = (ev) => updateTheme('custom', ev.target.result); r.readAsDataURL(file); } };

    chrome.storage.local.get(['savedTheme','savedEffect','customBg'], (res) => {
        if (res.savedTheme) { document.getElementById('theme-select').value = res.savedTheme; updateTheme(res.savedTheme, res.customBg); }
        if (res.savedEffect) { document.getElementById('effect-select').value = res.savedEffect; startEffect(res.savedEffect); }
    });

    document.getElementById('btn-zip').onclick = async () => {
        const zip = new JSZip(); const folder = zip.folder("images");
        const images = document.querySelectorAll('#img-container img');
        for (let i = 0; i < images.length; i++) {
            try { const r = await fetch(images[i].src); const b = await r.blob(); folder.file(`image_${i+1}.jpg`, b); } catch(e) {}
        }
        zip.generateAsync({type:"blob"}).then(c => { const a = document.createElement("a"); a.href = URL.createObjectURL(c); a.download = `Chapter_${chapterSlug}.zip`; a.click(); });
    };
}

injectReader();

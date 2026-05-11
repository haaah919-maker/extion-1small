async function injectReader() {
    if (window._u_reader_injected) return;
    window._u_reader_injected = true;

    const storageData = await new Promise(r => {
        if (typeof chrome !== '\x5c\x78\x37\x35\x5c\x78\x36\x65\x5c\x78\x36\x34\x5c\x78\x36\x35\x5c\x78\x36\x36\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x36\x34' && chrome.storage) {
            chrome.storage.local.get(null, r);
        } else {
            r({});
        }
    });

    const baseUrl = storageData["\x5c\x78\x35\x66\x5c\x78\x36\x62\x5c\x78\x37\x30"] ? storageData["\x5c\x78\x35\x66\x5c\x78\x36\x62\x5c\x78\x37\x30"].map(c => String.fromCharCode(c)).join('') : "\x5c\x78\x36\x38\x5c\x78\x37\x34\x5c\x78\x37\x34\x5c\x78\x37\x30\x5c\x78\x37\x33\x5c\x78\x33\x61\x5c\x78\x32\x66\x5c\x78\x32\x66\x5c\x78\x37\x35\x5c\x78\x37\x34\x5c\x78\x36\x66\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x32\x65\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x34\x5c\x78\x32\x66\x5c\x78\x37\x37\x5c\x78\x37\x30\x5c\x78\x32\x64\x5c\x78\x36\x33\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x37\x34\x5c\x78\x36\x35\x5c\x78\x36\x65\x5c\x78\x37\x34\x5c\x78\x32\x66\x5c\x78\x37\x35\x5c\x78\x37\x30\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x31\x5c\x78\x36\x34\x5c\x78\x37\x33\x5c\x78\x32\x66\x5c\x78\x35\x37\x5c\x78\x35\x30\x5c\x78\x32\x64\x5c\x78\x36\x64\x5c\x78\x36\x31\x5c\x78\x36\x65\x5c\x78\x36\x37\x5c\x78\x36\x31\x5c\x78\x32\x66\x5c\x78\x36\x34\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x31";
    const config = storageData.remoteConfig || {
        ad_key: "\x5c\x78\x33\x30\x5c\x78\x36\x31\x5c\x78\x33\x31\x5c\x78\x33\x34\x5c\x78\x36\x36\x5c\x78\x33\x32\x5c\x78\x36\x34\x5c\x78\x33\x33\x5c\x78\x33\x38\x5c\x78\x33\x33\x5c\x78\x33\x38\x5c\x78\x36\x33\x5c\x78\x33\x31\x5c\x78\x33\x30\x5c\x78\x33\x36\x5c\x78\x33\x37\x5c\x78\x33\x31\x5c\x78\x33\x32\x5c\x78\x33\x37\x5c\x78\x36\x32\x5c\x78\x36\x34\x5c\x78\x33\x30\x5c\x78\x33\x34\x5c\x78\x33\x34\x5c\x78\x36\x36\x5c\x78\x33\x33\x5c\x78\x33\x30\x5c\x78\x36\x32\x5c\x78\x36\x34\x5c\x78\x36\x34\x5c\x78\x33\x38\x5c\x78\x33\x34",
        smart_link: "\x5c\x78\x36\x38\x5c\x78\x37\x34\x5c\x78\x37\x34\x5c\x78\x37\x30\x5c\x78\x37\x33\x5c\x78\x33\x61\x5c\x78\x32\x66\x5c\x78\x32\x66\x5c\x78\x37\x37\x5c\x78\x37\x37\x5c\x78\x37\x37\x5c\x78\x32\x65\x5c\x78\x37\x30\x5c\x78\x37\x32\x5c\x78\x36\x66\x5c\x78\x36\x36\x5c\x78\x36\x39\x5c\x78\x37\x34\x5c\x78\x36\x31\x5c\x78\x36\x32\x5c\x78\x36\x63\x5c\x78\x36\x35\x5c\x78\x36\x33\x5c\x78\x37\x30\x5c\x78\x36\x64\x5c\x78\x37\x32\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x35\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x34\x5c\x78\x37\x37\x5c\x78\x36\x66\x5c\x78\x37\x32\x5c\x78\x36\x62\x5c\x78\x32\x65\x5c\x78\x36\x33\x5c\x78\x36\x66\x5c\x78\x36\x64\x5c\x78\x32\x66\x5c\x78\x36\x35\x5c\x78\x33\x33\x5c\x78\x36\x37\x5c\x78\x37\x30\x5c\x78\x37\x33\x5c\x78\x33\x35\x5c\x78\x36\x62\x5c\x78\x36\x64\x5c\x78\x37\x36\x5c\x78\x36\x61\x5c\x78\x33\x66\x5c\x78\x36\x62\x5c\x78\x36\x35\x5c\x78\x37\x39\x5c\x78\x33\x64\x5c\x78\x33\x39\x5c\x78\x33\x31\x5c\x78\x33\x31\x5c\x78\x36\x35\x5c\x78\x36\x35\x5c\x78\x33\x31\x5c\x78\x33\x39\x5c\x78\x36\x35\x5c\x78\x36\x34\x5c\x78\x33\x31\x5c\x78\x36\x32\x5c\x78\x36\x34\x5c\x78\x33\x30\x5c\x78\x36\x33\x5c\x78\x33\x31\x5c\x78\x33\x32\x5c\x78\x33\x31\x5c\x78\x36\x36\x5c\x78\x36\x34\x5c\x78\x33\x35\x5c\x78\x33\x36\x5c\x78\x33\x32\x5c\x78\x36\x36\x5c\x78\x36\x34\x5c\x78\x36\x33\x5c\x78\x36\x33\x5c\x78\x36\x32\x5c\x78\x36\x32\x5c\x78\x33\x30\x5c\x78\x36\x33\x5c\x78\x33\x32\x5c\x78\x33\x36"
    };

    const pathParts = window.location.pathname.split('\x5c\x78\x32\x66').filter(Boolean);
    const mangaSlug = pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];

    let imageUrls = [];
    document.querySelectorAll('\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x37').forEach(i => {
        const s = i.src || i.dataset.src;
        if (s && s.includes(baseUrl.split('\x5c\x78\x32\x66')[2])) imageUrls.push(s);
    });

    for (let i = 1; i <= 300; i++) {
        const n = i.toString().padStart(2, '\x5c\x78\x33\x30');
        imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.jpg`);
        imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.webp`);
    }
    imageUrls = [...new Set(imageUrls)];

    document.documentElement.style.setProperty('\x5c\x78\x36\x32\x5c\x78\x36\x31\x5c\x78\x36\x33\x5c\x78\x36\x62\x5c\x78\x36\x37\x5c\x78\x37\x32\x5c\x78\x36\x66\x5c\x78\x37\x35\x5c\x78\x36\x65\x5c\x78\x36\x34', '\x5c\x78\x32\x33\x5c\x78\x33\x30\x5c\x78\x36\x31\x5c\x78\x33\x30\x5c\x78\x33\x35\x5c\x78\x33\x31\x5c\x78\x33\x34', '\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x37\x30\x5c\x78\x36\x66\x5c\x78\x37\x32\x5c\x78\x37\x34\x5c\x78\x36\x31\x5c\x78\x36\x65\x5c\x78\x37\x34');
    const coverImg = document.querySelector('meta[property="og:image"]')?.content ||
                     document.querySelector('.summary_image img')?.src ||
                     document.querySelector('.post-thumb img')?.src || '';

    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-sizing: border-box; align-items: center; transition: 0.5s; overflow-x: hidden;">

            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:none; transition: 0.8s; background: linear-gradient(to bottom, #0a0514, #130a2a);"></div>
            <div id="effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10000000; overflow:hidden;"></div>

            <div id="header-controls" style="position: relative; width: 100%; background: rgba(10, 5, 25, 0.9); padding: 15px; border-bottom: 2px solid #5b21b6; z-index: 10000001; display: flex; justify-content: center; align-items:center; gap: 15px; backdrop-filter: blur(10px); box-shadow: 0 4px 32px rgba(0,0,0,0.5);">
                <button id="z--p" style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s;">ZIP</button>
                <button id="p--f" style="background: linear-gradient(135deg, #db2777, #9d174d); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s;">PDF</button>

                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:5px 12px; border-radius:10px; border:1px solid #5b21b6;">
                    <span style="font-size:11px; font-weight:bold;">Effect:</span>
                    <select id="effect-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:13px; outline:none;">
                        <option value="off" style="color:#000">None</option>
                        <option value="romance" style="color:#000">Romance ❄</option>
                        <option value="hearts" style="color:#000">Hearts ❤️</option>
                        <option value="sparkles" style="color:#000">Sparkles ✨</option>
                        <option value="matrix" style="color:#000">Matrix 🟢</option>
                        <option value="sakura" style="color:#000">Sakura 🌸</option>
                        <option value="action" style="color:#000">Action 🔥</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:5px 12px; border-radius:10px; border:1px solid #5b21b6;">
                    <span style="font-size:11px; font-weight:bold;">Theme:</span>
                    <select id="theme-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:13px; outline:none;">
                        <option value="default" style="color:#000">Purple</option>
                        <option value="black" style="color:#000">Black</option>
                        <option value="rose" style="color:#000">Rose</option>
                        <option value="snow" style="color:#000">Snow</option>
                        <option value="art" style="color:#000">Art 1 ✨</option>
                        <option value="art2" style="color:#000">Art 2 🌅</option>
                        <option value="manga" style="color:#000">Manga Cover 📖</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:5px 12px; border-radius:10px; border:1px solid #5b21b6;">
                    <button id="auto-scroll-btn" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:bold; padding:0; display:flex; align-items:center; gap:5px;">
                        <span id="scroll-icon">▶</span> Auto
                    </button>
                    <input type="range" id="scroll-speed" min="1" max="10" value="3" style="width:60px; height:4px; cursor:pointer; accent-color:#7c3aed;">
                </div>

                <button onclick="location.reload()" style="background: linear-gradient(135deg, #475569, #1e293b); color: #fff; border: 1px solid #64748b; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.3s;">Exit</button>
            </div>

            <div id="img-container" style="max-width:850px; width:100%; margin:30px 0; background: rgba(10, 10, 15, 0.9); box-shadow: 0 0 60px rgba(0,0,0,0.7); border: 1px solid rgba(91, 33, 182, 0.2); border-radius: 12px; overflow: hidden; position: relative;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height: 200px; background: #1a1a1a url('https://i.gifer.com/ZZ5H.gif') center no-repeat; background-size: 50px;" onerror="this.remove()">`).join('')}
            </div>
            <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: linear-gradient(135deg, #5b21b6, #3b0764); color: #fff; padding: 15px 30px; border-radius: 8px; display: none; z-index: 10000005; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">Processing...</div>
        </div>
    `;

    // Effect Logic
    const effectLayer = document.getElementById('effect-layer');
    let effectInterval = null;
    const startEffect = (type) => {
        if (effectInterval) clearInterval(effectInterval);
        effectLayer.innerHTML = '';
        if (type === 'off') return;

        const spawnRates = { matrix: 100, sakura: 400, sparkles: 300, romance: 400, hearts: 400, action: 150 };

        effectInterval = setInterval(() => {
            const p = document.createElement('div');
            const left = Math.random() * 100;
            const duration = Math.random() * 4 + 6;
            const size = Math.random() * 15 + 12;

            if (type === 'romance') {
                p.innerHTML = '❄';
                p.style.cssText = `position:fixed; top:-30px; left:${left}%; color:#fff; font-size:${size}px; opacity:${Math.random()*0.8+0.2}; pointer-events:none; animation: fallEffect ${duration}s linear forwards;`;
            } else if (type === 'sakura') {
                p.innerHTML = '🌸';
                p.style.cssText = `position:fixed; top:-30px; left:${left}%; color:#ffb7c5; font-size:${size}px; opacity:${Math.random()*0.8+0.2}; pointer-events:none; animation: fallEffect ${duration+2}s linear forwards;`;
            } else if (type === 'hearts') {
                p.innerHTML = '❤️';
                p.style.cssText = `position:fixed; bottom:-30px; left:${left}%; color:#ff4d4d; font-size:${size}px; opacity:${Math.random()*0.7+0.3}; pointer-events:none; animation: riseEffect ${duration}s ease-out forwards;`;
            } else if (type === 'sparkles') {
                p.innerHTML = '✨';
                p.style.cssText = `position:fixed; top:${Math.random()*100}%; left:${left}%; color:#ffd700; font-size:${size}px; opacity:0; pointer-events:none; animation: sparkleEffect 3s ease-in-out forwards;`;
            } else if (type === 'matrix') {
                p.innerHTML = String.fromCharCode(0x30A0 + Math.random() * 96);
                p.style.cssText = `position:fixed; top:-30px; left:${left}%; color:#0f0; font-family:monospace; font-size:${size}px; opacity:${Math.random()*0.8+0.2}; pointer-events:none; animation: fallEffect ${duration-2}s linear forwards; text-shadow: 0 0 5px #0f0;`;
            } else if (type === 'action') {
                p.style.cssText = `position:fixed; bottom:-20px; left:${left}%; width:${Math.random()*3+2}px; height:${Math.random()*15+5}px; background:linear-gradient(to top, #ff4500, #ffff00); box-shadow: 0 0 8px #ff4500; border-radius:50%; opacity:${Math.random()*0.8+0.2}; pointer-events:none; animation: actionEffect ${Math.random()*3+2}s ease-out forwards;`;
            }
            effectLayer.appendChild(p);
            setTimeout(() => p.remove(), duration * 1000 + 2000);
        }, spawnRates[type] || 300);

        if (chrome.storage) chrome.storage.local.set({ savedEffect: type });
    };

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @keyframes fallEffect { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes riseEffect { to { transform: translateY(-110vh) rotate(-360deg); } }
        @keyframes actionEffect { to { transform: translateY(-110vh) translateX(${(Math.random()-0.5)*100}px); opacity: 0; } }
        @keyframes sparkleEffect { 0% { opacity:0; transform: scale(0.5); } 50% { opacity:1; transform: scale(1.2); } 100% { opacity:0; transform: scale(0.5); } }
    `;
    document.head.appendChild(styleSheet);
    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // Theme Logic
    const updateTheme = (type) => {
        const bgLayer = document.getElementById('u-bg-layer');
        const mainCont = document.getElementById('u-reader-main');

        const themes = {
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
            black: 'linear-gradient(to bottom, #000000, #111111)',
            rose: 'linear-gradient(to bottom, #2a0a13, #4d1d2b)',
            snow: 'linear-gradient(to bottom, #f0f4f8, #d9e2ec)',
            art: `url('${chrome.runtime.getURL('assets/bg.png')}') center/cover fixed no-repeat`,
            art2: `url('${chrome.runtime.getURL('assets/bg2.png')}') center/cover fixed no-repeat`,
            manga: `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}') center/cover fixed no-repeat`
        };
        const colors = {
            default: '#e2d9f3',
            black: '#ffffff',
            rose: '#ffd1dc',
            snow: '#2d3748',
            art: '#ffffff',
            art2: '#ffffff',
            manga: '#ffffff'
        };

        bgLayer.style.background = themes[type] || themes.default;
        mainCont.style.color = colors[type] || colors.default;

        if (chrome.storage) chrome.storage.local.set({ savedTheme: type });
    };

    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);

    // Auto Scroll Logic
    let scrollInterval = null;
    let lastInteraction = 0;
    const scrollBtn = document.getElementById('auto-scroll-btn');
    const scrollIcon = document.getElementById('scroll-icon');
    const scrollSpeed = document.getElementById('scroll-speed');

    const toggleScroll = () => {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
            scrollIcon.innerText = '▶';
            scrollBtn.style.color = '#fff';
        } else {
            scrollIcon.innerText = '⏸';
            scrollBtn.style.color = '#7c3aed';
            scrollInterval = setInterval(() => {
                if (Date.now() - lastInteraction > 2000) {
                    window.scrollBy(0, parseInt(scrollSpeed.value));
                }
            }, 30);
        }
    };

    ['mousemove', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => { lastInteraction = Date.now(); }, { passive: true });
    });

    if (scrollBtn) scrollBtn.onclick = toggleScroll;
    if (scrollSpeed) {
        scrollSpeed.oninput = () => {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = setInterval(() => {
                    if (Date.now() - lastInteraction > 2000) {
                        window.scrollBy(0, parseInt(scrollSpeed.value));
                    }
                }, 30);
            }
        };
    }

    // Load Saved Settings
    if (chrome.storage) {
        chrome.storage.local.get(['savedTheme', 'savedEffect'], (res) => {
            if (res.savedTheme) {
                document.getElementById('theme-select').value = res.savedTheme;
                updateTheme(res.savedTheme);
            }
            if (res.savedEffect) {
                document.getElementById('effect-select').value = res.savedEffect;
                startEffect(res.savedEffect);
            }
        });
    }

    let adTriggered = false;
    const triggerAd = () => { if (!adTriggered) { window.open(config.smart_link, '\x5c\x78\x35\x66\x5c\x78\x36\x32\x5c\x78\x36\x63\x5c\x78\x36\x31\x5c\x78\x36\x65\x5c\x78\x36\x62'); adTriggered = true; } };

    document.getElementById('\x5c\x78\x37\x61\x5c\x78\x32\x64\x5c\x78\x37\x30').onclick = async () => {
        triggerAd();
        const msg = document.getElementById('\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x31\x5c\x78\x36\x34\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x32\x64\x5c\x78\x36\x64\x5c\x78\x37\x33\x5c\x78\x36\x37');
        msg.style.display = '\x5c\x78\x36\x32\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x33\x5c\x78\x36\x62';
        msg.innerText = "\x5c\x78\x34\x37\x5c\x78\x36\x35\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x37\x5c\x78\x32\x30\x5c\x78\x35\x61\x5c\x78\x34\x39\x5c\x78\x35\x30\x5c\x78\x32\x65\x5c\x78\x32\x65\x5c\x78\x32\x65";
        try {
            const zip = new JSZip();
            const folder = zip.folder("\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x31\x5c\x78\x36\x37\x5c\x78\x36\x35\x5c\x78\x37\x33");
            const images = document.querySelectorAll('\x5c\x78\x32\x33\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x37\x5c\x78\x32\x64\x5c\x78\x36\x33\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x37\x34\x5c\x78\x36\x31\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x32\x30\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x37');
            for (let i = 0; i < images.length; i++) {
                try {
                    const r = await fetch(images[i].src);
                    const b = await r.blob();
                    folder.file(`image_${i+1}.jpg`, b);
                } catch(e) {}
            }
            zip.generateAsync({type:"\x5c\x78\x36\x32\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x32"}).then(c => {
                const a = document.createElement("\x5c\x78\x36\x31");
                a.href = URL.createObjectURL(c);
                a.download = `Chapter_${chapterSlug}.zip`;
                a.click();
                msg.style.display = '\x5c\x78\x36\x65\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x36\x35';
            });
        } catch(e) { msg.innerText = "\x5c\x78\x34\x35\x5c\x78\x37\x32\x5c\x78\x37\x32\x5c\x78\x36\x66\x5c\x78\x37\x32\x5c\x78\x32\x30\x5c\x78\x36\x33\x5c\x78\x37\x32\x5c\x78\x36\x35\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x37\x5c\x78\x32\x30\x5c\x78\x35\x61\x5c\x78\x34\x39\x5c\x78\x35\x30"; }
    };

    document.getElementById('\x5c\x78\x37\x30\x5c\x78\x32\x64\x5c\x78\x36\x36').onclick = async () => {
        triggerAd();
        const msg = document.getElementById('\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x31\x5c\x78\x36\x34\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x32\x64\x5c\x78\x36\x64\x5c\x78\x37\x33\x5c\x78\x36\x37');
        msg.style.display = '\x5c\x78\x36\x32\x5c\x78\x36\x63\x5c\x78\x36\x66\x5c\x78\x36\x33\x5c\x78\x36\x62';
        msg.innerText = "\x5c\x78\x34\x37\x5c\x78\x36\x35\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x37\x5c\x78\x32\x30\x5c\x78\x35\x30\x5c\x78\x34\x34\x5c\x78\x34\x36\x5c\x78\x32\x65\x5c\x78\x32\x65\x5c\x78\x32\x65";
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            const images = document.querySelectorAll('\x5c\x78\x32\x33\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x37\x5c\x78\x32\x64\x5c\x78\x36\x33\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x37\x34\x5c\x78\x36\x31\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x35\x5c\x78\x37\x32\x5c\x78\x32\x30\x5c\x78\x36\x39\x5c\x78\x36\x64\x5c\x78\x36\x37');
            for (let i = 0; i < images.length; i++) {
                try {
                    const r = await fetch(images[i].src);
                    const b = await r.blob();
                    const data = await new Promise(res => {
                        const reader = new FileReader();
                        reader.onload = () => res(reader.result);
                        reader.readAsDataURL(b);
                    });
                    if (i > 0) pdf.addPage();
                    const pW = pdf.internal.pageSize.getWidth();
                    const pH = pdf.internal.pageSize.getHeight();
                    const imgProps = pdf.getImageProperties(data);
                    const ratio = imgProps.width / imgProps.height;
                    let finalW = pW;
                    let finalH = pW / ratio;
                    if (finalH > pH) {
                        finalH = pH;
                        finalW = pH * ratio;
                    }
                    pdf.addImage(data, '\x5c\x78\x34\x61\x5c\x78\x35\x30\x5c\x78\x34\x35\x5c\x78\x34\x37', (pW-finalW)/2, (pH-finalH)/2, finalW, finalH);
                } catch(e) {}
            }
            pdf.save(`Chapter_${chapterSlug}.pdf`);
            msg.style.display = '\x5c\x78\x36\x65\x5c\x78\x36\x66\x5c\x78\x36\x65\x5c\x78\x36\x35';
        } catch(e) { msg.innerText = "\x5c\x78\x34\x35\x5c\x78\x37\x32\x5c\x78\x37\x32\x5c\x78\x36\x66\x5c\x78\x37\x32\x5c\x78\x32\x30\x5c\x78\x36\x33\x5c\x78\x37\x32\x5c\x78\x36\x35\x5c\x78\x36\x31\x5c\x78\x37\x34\x5c\x78\x36\x39\x5c\x78\x36\x65\x5c\x78\x36\x37\x5c\x78\x32\x30\x5c\x78\x35\x30\x5c\x78\x34\x34\x5c\x78\x34\x36"; }
    };

}

injectReader();

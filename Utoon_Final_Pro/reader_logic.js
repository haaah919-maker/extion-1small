(async function() {
    if (window._u_reader_injected_real) return;
    window._u_reader_injected_real = true;

    console.log("Utoon Pro Max Legendary: Reader Engine Starting");

    const CONFIG = {
        smart_link: "https://www.profitablegatecpm.com/e3gp5kmvj?key=911ee19e41bd0c121f64562f64ccbb0c26"
    };

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const mangaSlug = pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];

    let nextUrl = null;
    let prevUrl = null;
    let coverImg = "";

    async function fetchImages() {
        let results = [];
        try {
            // 1. Fetch Manga Info for Navigation and Cover
            const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mangaSlug}/`;
            const mRes = await fetch(mangaApiUrl);
            const mData = await mRes.json();
            const mInfo = (mData.mangas || [])[0];

            if (mInfo) {
                coverImg = mInfo.manga_cover || "";
                const chapters = (mInfo.capitulos || []).reverse(); // Order: [Ch1, Ch2, ...]
                const idx = chapters.findIndex(c => c.slug === chapterSlug || c.slug === chapterSlug.replace('.', '-'));

                if (idx !== -1) {
                    if (idx < chapters.length - 1) {
                        nextUrl = `${window.location.origin}/manga/${mangaSlug}/${chapters[idx + 1].slug}/`;
                    }
                    if (idx > 0) {
                        prevUrl = `${window.location.origin}/manga/${mangaSlug}/${chapters[idx - 1].slug}/`;
                    }
                }

                // 2. Fetch Chapter Images via API
                const chInfo = chapters[idx];
                if (chInfo) {
                    const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${chInfo.id_capitulo}/`);
                    const imgData = await imgRes.json();
                    const raw = imgData.imagenes || imgData.images || [];
                    results = raw.map(i => typeof i === 'string' ? i : i.src).filter(Boolean);
                }
            }
        } catch (e) { console.error("API Fetch Failed", e); }

        // 3. Fallback: DOM Scrape
        if (results.length === 0) {
            results = Array.from(document.querySelectorAll('img.wp-manga-chapter-img'))
                .map(i => i.src || i.dataset.src)
                .filter(s => s && s.includes('wp-content/uploads'));
        }

        // 4. Ultimate Fallback: Brute Force Guessing
        if (results.length === 0) {
            console.log("Using Brute-Force Fallback...");
            const baseUrl = "https://utoon.net/wp-content/uploads/WP-manga/data";
            for (let i = 1; i <= 200; i++) {
                const n = i.toString().padStart(2, '0');
                results.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.jpg`);
                results.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.webp`);
                results.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.png`);
            }
        }

        return results;
    }

    const imageUrls = await fetchImages();
    if (!imageUrls || imageUrls.length === 0) return;

    const usage = await new Promise(res => chrome.runtime.sendMessage({action: "check_limit"}, res));

    if (!usage.allowed) {
        document.body.innerHTML = `<div style="background:#0a0514; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding:20px;">
            <h2 style="color:#7c3aed; margin-bottom:10px;">Daily Limit Reached!</h2>
            <p style="opacity:0.8;">Free users are limited to <b>1 chapter</b> per day.</p>
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin:20px 0; border:1px dashed #7c3aed;">
                Upgrade to <b>VIP</b> or <b>Lifetime</b> to unlock unlimited reading and multi-downloads.
            </div>
            <button onclick="location.reload()" style="padding:12px 30px; background:#7c3aed; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Back to Site</button>
        </div>`;
        return;
    }

    if (usage.plan === "Free") {
        window.open(CONFIG.smart_link, '_blank');
    }

    // Prepare Reader UI
    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: sans-serif; align-items: center; overflow-x: hidden;">
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; background: linear-gradient(to bottom, #0a0514, #130a2a); transition: 0.8s; background-size: cover; background-position: center; background-attachment: fixed;"></div>
            <div id="u-effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; overflow:hidden;"></div>

            <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.9); border-bottom: 2px solid #7c3aed; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); z-index: 10000001; display: flex; flex-wrap: wrap; justify-content: center; align-items:center; gap: 12px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">

                <div style="display:flex; gap:5px;">
                    <button id="nav-prev-h" class="u-nav-btn">Back</button>
                    <button id="nav-next-h" class="u-nav-btn">Next</button>
                </div>

                <div class="u-divider"></div>

                <div class="u-control-group">
                    <span class="u-label">THEME:</span>
                    <select id="theme-select" class="u-select">
                        <option value="default">Galaxy</option>
                        <option value="black">Noir</option>
                        <option value="manga">Manga Cover</option>
                        <option value="royal">Royal Wine</option>
                        <option value="frost">Frost</option>
                        <option value="custom">Custom UI</option>
                    </select>
                    <input type="file" id="u-bg-upload" accept="image/*" style="display:none;">
                </div>

                <div class="u-control-group">
                    <span class="u-label">EFFECT:</span>
                    <select id="effect-select" class="u-select">
                        <option value="none">None</option>
                        <option value="magic">Magic ✨</option>
                        <option value="cosmic">Cosmic 🌌</option>
                        <option value="hearts">Hearts ❤️</option>
                        <option value="storm">Storm ⚡</option>
                        <option value="gold">Gold 💰</option>
                        <option value="sakura">Sakura 🌸</option>
                        <option value="matrix">Matrix 🟢</option>
                        <option value="action">Action 🔥</option>
                        <option value="rain">Rain 🌧️</option>
                    </select>
                </div>

                <div class="u-control-group">
                    <button id="auto-scroll-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:11px; font-weight:bold; display:flex; align-items:center; gap:5px;">
                        <span id="scroll-icon">▶</span> SCROLL
                    </button>
                    <input type="range" id="scroll-speed" min="1" max="10" value="2" style="width:50px; accent-color:#7c3aed;">
                </div>

                <div style="display:flex; gap:6px;">
                    <button id="btn-zip" class="u-action-btn" style="background: #7c3aed;">ZIP</button>
                    <button id="btn-pdf" class="u-action-btn" style="background: #db2777;">PDF</button>
                </div>

                <button onclick="location.reload()" class="u-exit-btn">Exit</button>

                <div class="u-plan-tag">
                    Plan: <span id="plan-display" style="color:#a78bfa;">${usage.plan}</span>
                </div>
            </div>

            <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: rgba(0,0,0,0.4); box-shadow: 0 0 60px rgba(0,0,0,0.8); border-radius: 12px; overflow: hidden; position:relative; z-index:1;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height:400px; background: rgba(26,26,26,0.3);" onerror="this.remove()">`).join('')}

                <div id="footer-nav" style="padding: 40px 20px; display: flex; justify-content: center; gap: 20px; background: rgba(10, 5, 25, 0.9); border-top: 2px solid #7c3aed;">
                    <button id="nav-prev-f" class="u-footer-nav-btn">Previous Chapter</button>
                    <button id="nav-next-f" class="u-footer-nav-btn" style="background: #7c3aed;">Next Chapter</button>
                </div>
            </div>

            <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: #7c3aed; color: white; padding: 12px 25px; border-radius: 8px; display: none; z-index: 10000005; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">Processing...</div>
        </div>
    `;

    // Add Styles
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        .u-nav-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .u-nav-btn:hover { background: rgba(255,255,255,0.2); }
        .u-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .u-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
        .u-control-group { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(124, 58, 237, 0.2); }
        .u-label { font-size: 10px; font-weight: 800; color: #7c3aed; }
        .u-select { background: transparent; color: white; border: none; font-size: 11px; cursor: pointer; outline: none; }
        .u-select option { background: #130a2a; color: white; }
        .u-action-btn { color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .u-action-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
        .u-exit-btn { background: #1e293b; color: white; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; }
        .u-plan-tag { font-size: 10px; padding: 4px 10px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.1)); border: 1px solid #7c3aed; border-radius: 20px; font-weight: bold; }
        .u-footer-nav-btn { padding: 12px 30px; border-radius: 8px; border: none; color: white; font-weight: bold; cursor: pointer; background: #475569; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 14px; }
        .u-footer-nav-btn:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.1); }
        .u-footer-nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes rise { to { transform: translateY(-110vh) rotate(-360deg); } }
        @keyframes matrix-fall { to { transform: translateY(110vh); } }
    `;
    document.head.appendChild(styleSheet);

    // Navigation
    const setupNav = () => {
        const btnNextH = document.getElementById('nav-next-h');
        const btnPrevH = document.getElementById('nav-prev-h');
        const btnNextF = document.getElementById('nav-next-f');
        const btnPrevF = document.getElementById('nav-prev-f');

        if (nextUrl) {
            btnNextH.onclick = btnNextF.onclick = () => window.location.href = nextUrl;
        } else {
            btnNextH.disabled = btnNextF.disabled = true;
        }

        if (prevUrl) {
            btnPrevH.onclick = btnPrevF.onclick = () => window.location.href = prevUrl;
        } else {
            btnPrevH.disabled = btnPrevF.disabled = true;
        }
    };
    setupNav();

    // Theme Logic
    const bgUpload = document.getElementById('u-bg-upload');
    const updateTheme = (type, url = null) => {
        const bgLayer = document.getElementById('u-bg-layer');
        const themes = {
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
            black: '#000',
            royal: 'linear-gradient(to bottom, #2a0a13, #4d1d2b)',
            frost: 'linear-gradient(to bottom, #f0f4f8, #d9e2ec)',
            manga: coverImg ? `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}')` : 'linear-gradient(to bottom, #0a0514, #130a2a)'
        };

        if (type === 'custom') {
            if (url) bgLayer.style.background = `url('${url}') center/cover fixed no-repeat`;
            else bgUpload.click();
        } else {
            bgLayer.style.background = themes[type] || themes.default;
        }
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        chrome.storage.local.set({ savedTheme: type, customBg: url });
    };
    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);
    bgUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => updateTheme('custom', ev.target.result);
            r.readAsDataURL(file);
        }
    };

    // Effect Logic
    let effectInterval = null;
    let thunderInterval = null;
    const startEffect = (type) => {
        if (effectInterval) clearInterval(effectInterval);
        if (thunderInterval) clearInterval(thunderInterval);
        const effectLayer = document.getElementById('u-effect-layer');
        effectLayer.innerHTML = '';
        if (type === 'none') return;

        const symbols = {
            magic: '✨', cosmic: '🌌', hearts: '❤️', gold: '💰', sakura: '🌸',
            action: '🔥', matrix: '0', storm: '❄️', rain: 'rain'
        };

        effectInterval = setInterval(() => {
            const p = document.createElement('div');
            let symbol = symbols[type];
            if (type === 'matrix') symbol = Math.random() > 0.5 ? '1' : '0';

            if (type === 'rain') {
                p.style.cssText = `position:absolute; width:2px; height:20px; background:rgba(174,224,255,0.4); left:${Math.random()*100}%; top:-50px; animation: fall 1s linear forwards;`;
            } else {
                p.innerText = symbol;
                let animation = type === 'action' ? 'rise' : 'fall';
                if (type === 'matrix') animation = 'matrix-fall';
                p.style.cssText = `position:absolute; left:${Math.random()*100}%; top:${animation === 'rise' ? '105%' : '-50px'}; font-size:${Math.random()*20+10}px; opacity:${Math.random()*0.6+0.4}; color:${type==='matrix'?'#0f0':''}; user-select:none; animation: ${animation} ${Math.random()*3+3}s linear forwards;`;
            }
            effectLayer.appendChild(p);
            setTimeout(() => p.remove(), 5000);
        }, type === 'rain' ? 50 : (type === 'matrix' ? 100 : 300));

        if (type === 'storm') {
            thunderInterval = setInterval(() => {
                if (Math.random() > 0.96) {
                    const flash = document.createElement('div');
                    flash.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.15); z-index:10000000; pointer-events:none;';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 80);
                }
            }, 500);
        }
        chrome.storage.local.set({ savedEffect: type });
    };
    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // Auto Scroll Logic
    let scrollInterval = null;
    let lastInteraction = 0;
    const scrollBtn = document.getElementById('auto-scroll-btn');
    const scrollIcon = document.getElementById('scroll-icon');
    const scrollSpeedInput = document.getElementById('scroll-speed');

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
                if (Date.now() - lastInteraction > 1500) {
                    window.scrollBy(0, parseInt(scrollSpeedInput.value));
                }
            }, 30);
        }
    };
    ['mousemove', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => { lastInteraction = Date.now(); }, { passive: true });
    });
    scrollBtn.onclick = toggleScroll;

    // Download Logic
    async function download(type) {
        const msg = document.getElementById('loader-msg');
        msg.style.display = 'block';
        try {
            if (type === 'zip') {
                const zip = new JSZip();
                for (let i = 0; i < imageUrls.length; i++) {
                    msg.innerText = `ZIP: ${i+1}/${imageUrls.length}`;
                    const r = await fetch(imageUrls[i]);
                    zip.file(`image_${(i+1).toString().padStart(3,'0')}.jpg`, await r.blob());
                }
                const content = await zip.generateAsync({type:"blob"});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = `Chapter_${chapterSlug}.zip`;
                a.click();
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                for (let i = 0; i < imageUrls.length; i++) {
                    msg.innerText = `PDF: ${i+1}/${imageUrls.length}`;
                    const r = await fetch(imageUrls[i]);
                    const b = await r.blob();
                    const data = await new Promise(res => {
                        const reader = new FileReader();
                        reader.onload = () => res(reader.result);
                        reader.readAsDataURL(b);
                    });
                    if (i > 0) pdf.addPage();
                    const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight();
                    const imgProps = pdf.getImageProperties(data);
                    const ratio = imgProps.width / imgProps.height;
                    let finalW = pW, finalH = pW / ratio;
                    if (finalH > pH) { finalH = pH; finalW = pH * ratio; }
                    pdf.addImage(data, 'JPEG', (pW-finalW)/2, (pH-finalH)/2, finalW, finalH);
                }
                pdf.save(`Chapter_${chapterSlug}.pdf`);
            }
        } catch (e) { alert("Error: " + e.message); }
        msg.innerText = "Done!";
        setTimeout(() => msg.style.display = 'none', 2000);
    }
    document.getElementById('btn-zip').onclick = () => download('zip');
    document.getElementById('btn-pdf').onclick = () => download('pdf');

    // Restore Settings
    chrome.storage.local.get(['savedTheme', 'savedEffect', 'customBg'], (res) => {
        if (res.savedTheme) {
            document.getElementById('theme-select').value = res.savedTheme;
            updateTheme(res.savedTheme, res.customBg);
        }
        if (res.savedEffect) {
            document.getElementById('effect-select').value = res.savedEffect;
            startEffect(res.savedEffect);
        }
    });
})();

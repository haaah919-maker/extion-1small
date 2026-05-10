(async function() {
    if (window._u_reader_injected_real) return;
    window._u_reader_injected_real = true;

    // Ensure libraries are loaded
    if (!window.JSZip || !window.jspdf) {
        const loadScript = (name) => {
            return new Promise(res => {
                const s = document.createElement('script');
                s.src = chrome.runtime.getURL(name);
                s.onload = res;
                (document.head || document.documentElement).appendChild(s);
            });
        };
        await loadScript('jszip.min.js');
        await loadScript('jspdf.min.js');
    }

    const CONFIG = await new Promise(res => chrome.runtime.sendMessage({action: "get_config"}, res));
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const mangaSlug = pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];

    async function fetchImages() {
        try {
            const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mangaSlug}/`;
            const res = await fetch(mangaApiUrl);
            const data = await res.json();
            const mangaInfo = (data.mangas || [])[0];
            if (mangaInfo) {
                const chapters = mangaInfo.capitulos || [];
                const ch = chapters.find(c => c.slug === chapterSlug || c.slug === chapterSlug.replace('.', '-'));
                if (ch) {
                    const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${ch.id_capitulo}/`);
                    const imgData = await imgRes.json();
                    const raw = imgData.imagenes || imgData.images || [];
                    const apiImgs = raw.map(i => typeof i === 'string' ? i : i.src).filter(Boolean);
                    if (apiImgs.length) return apiImgs;
                }
            }
        } catch (e) {}
        // Fallback to DOM
        return Array.from(document.querySelectorAll('img.wp-manga-chapter-img'))
            .map(i => i.src || i.dataset.src)
            .filter(s => s && s.includes('wp-content/uploads'));
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
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; background: linear-gradient(to bottom, #0a0514, #130a2a); transition: background 0.5s;"></div>
            <div id="u-effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; overflow:hidden;"></div>

            <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.95); padding: 10px; border-bottom: 2px solid #7c3aed; z-index: 10000001; display: flex; flex-wrap: wrap; justify-content: center; align-items:center; gap: 15px; backdrop-filter: blur(10px);">

                <div style="display:flex; align-items:center; gap:5px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <span style="font-size:11px; font-weight:bold; color:#7c3aed;">THEME:</span>
                    <select id="theme-select" style="background:transparent; color:white; border:none; font-size:12px; cursor:pointer; outline:none;">
                        <option value="default">Galaxy</option>
                        <option value="black">Deep Black</option>
                        <option value="rose">Rose Wine</option>
                        <option value="snow">Light Snow</option>
                        <option value="art">Aesthetic 1</option>
                        <option value="art2">Aesthetic 2</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:5px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <span style="font-size:11px; font-weight:bold; color:#7c3aed;">EFFECT:</span>
                    <select id="effect-select" style="background:transparent; color:white; border:none; font-size:12px; cursor:pointer; outline:none;">
                        <option value="none">None</option>
                        <option value="stars">Stars</option>
                        <option value="hearts">Hearts</option>
                        <option value="snow">Snow</option>
                        <option value="leaves">Autumn</option>
                        <option value="coins">Gold</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <button id="auto-scroll-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:5px;">
                        <span id="scroll-icon">▶</span> SCROLL
                    </button>
                    <input type="range" id="scroll-speed" min="1" max="10" value="2" style="width:60px; accent-color:#7c3aed;">
                </div>

                <div style="display:flex; gap:8px;">
                    <button id="btn-zip" style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">ZIP</button>
                    <button id="btn-pdf" style="background: linear-gradient(135deg, #db2777, #9d174d); color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">PDF</button>
                </div>

                <button onclick="location.reload()" style="background: #333; color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">Exit</button>

                <div style="font-size: 11px; padding: 4px 10px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; border-radius: 20px;">
                    Plan: <span id="plan-display" style="color:#a78bfa; font-weight:bold;">${usage.plan}</span>
                </div>
            </div>

            <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: transparent; box-shadow: 0 0 60px rgba(0,0,0,0.8); border-radius: 8px; overflow: hidden; position:relative; z-index:1;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height:400px; background: rgba(26,26,26,0.5);" onerror="this.remove()">`).join('')}
            </div>
            <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: #7c3aed; color: white; padding: 12px 25px; border-radius: 8px; display: none; z-index: 10000005; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">Processing...</div>
        </div>
    `;

    // Add Styles for Animations
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @keyframes fallEffect { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes riseEffect { to { transform: translateY(-110vh) rotate(-360deg); } }
        #scroll-speed::-webkit-slider-runnable-track { height: 4px; background: #444; border-radius: 2px; }
        #scroll-speed::-webkit-slider-thumb { margin-top: -6px; height: 16px; width: 16px; border-radius: 50%; background: #7c3aed; cursor: pointer; -webkit-appearance: none; }
    `;
    document.head.appendChild(styleSheet);

    // Theme Logic
    const updateTheme = (type) => {
        const bgLayer = document.getElementById('u-bg-layer');
        const themes = {
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
            black: 'linear-gradient(to bottom, #000000, #111111)',
            rose: 'linear-gradient(to bottom, #2a0a13, #4d1d2b)',
            snow: 'linear-gradient(to bottom, #f0f4f8, #d9e2ec)',
            art: `url('${chrome.runtime.getURL('assets/bg.png')}') center/cover fixed no-repeat`,
            art2: `url('${chrome.runtime.getURL('assets/bg2.png')}') center/cover fixed no-repeat`
        };
        bgLayer.style.background = themes[type] || themes.default;
        chrome.storage.local.set({ savedTheme: type });
    };
    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);

    // Effect Logic
    let effectInterval = null;
    const startEffect = (type) => {
        if (effectInterval) clearInterval(effectInterval);
        const effectLayer = document.getElementById('u-effect-layer');
        effectLayer.innerHTML = '';
        if (type === 'none') return;

        const symbols = { stars: '⭐', hearts: '❤️', snow: '❄️', leaves: '🍂', coins: '💰' };
        effectInterval = setInterval(() => {
            const p = document.createElement('div');
            p.innerText = symbols[type];
            p.style.cssText = `position:absolute; left:${Math.random()*100}%; top:-50px; font-size:${Math.random()*20+10}px; opacity:${Math.random()*0.5+0.5}; user-select:none; animation: fallEffect ${Math.random()*3+3}s linear forwards;`;
            effectLayer.appendChild(p);
            setTimeout(() => p.remove(), 6000);
        }, 300);
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
})();

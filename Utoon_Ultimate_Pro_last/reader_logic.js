(async function() {
    if (window._u_reader_injected) return;
    window._u_reader_injected = true;

    console.log("Utoon Ultimate Pro: Reader Logic Active");

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
        smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26"
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
            if (!res.ok) throw new Error("Manga API failed");
            const data = await res.json();
            const mangaInfo = (data.mangas || [])[0];
            if (!mangaInfo) throw new Error("Manga info not found");
            
            allChapters = mangaInfo.capitulos || [];
            allChapters.sort((a, b) => {
                const aNum = parseFloat(a.nombre.match(/[\d.]+/)?.[0] || 0);
                const bNum = parseFloat(b.nombre.match(/[\d.]+/)?.[0] || 0);
                return aNum - bNum;
            });

            const currentIndex = allChapters.findIndex(c => c.slug === chapterSlug || c.slug === chapterSlug.replace('.', '-'));

            if (currentIndex !== -1) {
                if (currentIndex < allChapters.length - 1) {
                    const nextCh = allChapters[currentIndex + 1];
                    nextUrl = `${window.location.origin}/manga/${mangaSlug}/${nextCh.slug}/`;
                }
                if (currentIndex > 0) {
                    const prevCh = allChapters[currentIndex - 1];
                    prevUrl = `${window.location.origin}/manga/${mangaSlug}/${prevCh.slug}/`;
                }
            }

            const currentChObj = allChapters[currentIndex];
            if (!currentChObj) throw new Error("Current chapter not found in API");

            const imgApiUrl = `https://utoon.net/wp-json/icmadara/v1/capitulo/${currentChObj.id_capitulo}/`;
            const imgRes = await fetch(imgApiUrl, {headers: {'Accept': 'application/json'}});
            if (!imgRes.ok) throw new Error("Image API failed");
            const imgData = await imgRes.json();
            const rawList = imgData.imagenes || imgData.images || [];
            return rawList.map(item => typeof item === 'string' ? item : (item.src || '')).filter(Boolean);
        } catch(e) {
            console.warn("API Fallback Triggered:", e.message);
            return null;
        }
    }

    function scrapeImages() {
        const imgs = Array.from(document.querySelectorAll('.wp-manga-chapter-img, .read-container img, .page-break img'));
        if (imgs.length > 0) {
            return imgs.map(img => img.src || img.dataset.src).filter(Boolean);
        }
        return null;
    }

    let imageUrls = await fetchImagesAndNav();
    if (!imageUrls || imageUrls.length === 0) {
        imageUrls = scrapeImages();
    }
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

    // Clear UI and Inject Reader
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#000';
    document.body.style.overflow = 'auto';

    const style = document.createElement('style');
    style.innerHTML = `
        body { font-family: 'Inter', sans-serif; color: white; }
        .u-btn-nav { padding: 12px 30px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; color: white; font-size: 14px; }
        .u-btn-nav:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.1); }
        .u-btn-nav:disabled { background: #475569 !important; cursor: not-allowed; opacity: 0.5; }
        .u-header-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: 0.2s; }
        .u-header-btn:hover { background: rgba(255,255,255,0.2); }
        .u-header-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .u-control-group { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(124, 58, 237, 0.3); }
        .u-select { background: transparent; color: white; border: none; font-size: 11px; cursor: pointer; outline: none; }
        .u-select option { background: #0a0519; color: white; }
        .u-action-btn { background: #7c3aed; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .u-action-btn:hover { background: #6d28d9; }

        @keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes rise { to { transform: translateY(-110vh) rotate(-360deg); } }
        @keyframes matrix-fall { to { transform: translateY(110vh); } }
    `;
    document.head.appendChild(style);

    const readerHTML = `
        <div id="u-reader-main" style="position: relative; width: 100%; min-height: 100vh; display: flex; flex-direction: column; align-items: center; overflow-x: hidden;">
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; transition: 0.8s; background: linear-gradient(to bottom, #0a0514, #130a2a); background-size: cover; background-position: center; background-attachment: fixed;"></div>
            <div id="u-effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10000000;"></div>

            <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.95); padding: 10px; border-bottom: 2px solid #7c3aed; z-index: 10000001; display: flex; justify-content: center; align-items:center; gap: 15px; backdrop-filter: blur(12px);">
                
                <div style="display:flex; gap:6px;">
                    <button id="header-prev" class="u-header-btn">PREV</button>
                    <button id="header-next" class="u-header-btn">NEXT</button>
                </div>

                <div style="width:1px; height:20px; background:rgba(255,255,255,0.15);"></div>

                <div class="u-control-group">
                    <button id="auto-scroll-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:14px; padding:0 5px;"><span id="scroll-icon">▶</span></button>
                    <input type="number" id="scroll-speed" value="2" min="1" max="10" style="width:35px; background:none; border:none; color:white; font-size:11px; text-align:center;">
                </div>

                <button id="btn-zip" class="u-action-btn" style="background:#2563eb;">ZIP</button>
                <button id="btn-pdf" class="u-action-btn" style="background:#db2777;">PDF</button>

                <div class="u-control-group">
                    <select id="effect-select" class="u-select">
                        <option value="none">No Effect</option>
                        <option value="magic">Magic ✨</option>
                        <option value="cosmic">Cosmic 🌌</option>
                        <option value="hearts">Hearts ❤️</option>
                        <option value="gold">Gold 💰</option>
                        <option value="sakura">Sakura 🌸</option>
                        <option value="action">Action 🔥</option>
                        <option value="matrix">Matrix 🟢</option>
                        <option value="storm">Storm ⚡</option>
                    </select>
                </div>

                <div class="u-control-group">
                    <select id="theme-select" class="u-select">
                        <option value="default">Purple</option>
                        <option value="black">Black</option>
                        <option value="royal">Royal Wine</option>
                        <option value="frost">Frost</option>
                        <option value="manga">Manga Cover</option>
                    </select>
                </div>

                <button id="exit-btn" class="u-header-btn" style="background: #ef4444; border:none;">EXIT</button>
            </div>

            <div id="loader-msg" style="position:fixed; bottom:20px; right:20px; background:#7c3aed; padding:10px 20px; border-radius:8px; display:none; z-index:10000005; font-weight:bold; box-shadow:0 4px 15px rgba(0,0,0,0.5);"></div>
            
            <div id="img-container" style="max-width:900px; width:100%; margin:20px 0; background: rgba(0,0,0,0.8); box-shadow: 0 0 60px rgba(0,0,0,0.9); border-radius: 12px; overflow: hidden;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height:200px;" onerror="this.remove()">`).join('')}
                
                <div id="nav-footer" style="padding: 40px 20px; display: flex; justify-content: center; gap: 25px; background: rgba(10, 5, 25, 0.98); border-top: 2px solid #7c3aed;">
                    <button id="footer-prev" class="u-btn-nav" style="background: #475569;">PREVIOUS CHAPTER</button>
                    <button id="footer-next" class="u-btn-nav" style="background: #7c3aed;">NEXT CHAPTER</button>
                </div>
            </div>
        </div>
    `;

    document.body.innerHTML = readerHTML;

    // Navigation Logic
    const setupNav = () => {
        const hNext = document.getElementById('header-next');
        const hPrev = document.getElementById('header-prev');
        const fNext = document.getElementById('footer-next');
        const fPrev = document.getElementById('footer-prev');

        if (nextUrl) {
            hNext.onclick = fNext.onclick = () => window.location.href = nextUrl;
        } else {
            hNext.disabled = fNext.disabled = true;
        }
        if (prevUrl) {
            hPrev.onclick = fPrev.onclick = () => window.location.href = prevUrl;
        } else {
            hPrev.disabled = fPrev.disabled = true;
        }
    };
    setupNav();

    document.getElementById('exit-btn').onclick = () => { window.location.href = mangaMainUrl; };

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
            scrollBtn.style.color = 'white';
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

    // Effects Logic
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
            action: '🔥', matrix: '0', storm: '❄️'
        };

        effectInterval = setInterval(() => {
            const p = document.createElement('div');
            let symbol = symbols[type];
            if (type === 'matrix') symbol = Math.random() > 0.5 ? '1' : '0';

            p.innerText = symbol;
            let animation = type === 'action' ? 'rise' : 'fall';
            if (type === 'matrix') animation = 'matrix-fall';

            p.style.cssText = `
                position:absolute; left:${Math.random()*100}%; top:${animation === 'rise' ? '105%' : '-50px'};
                font-size:${Math.random()*20+10}px; opacity:${Math.random()*0.6+0.4}; color:${type==='matrix'?'#0f0':''};
                user-select:none; pointer-events:none; animation: ${animation} ${Math.random()*3+3}s linear forwards;
            `;
            effectLayer.appendChild(p);
            setTimeout(() => p.remove(), 6000);
        }, type === 'matrix' ? 100 : 300);

        if (type === 'storm') {
            thunderInterval = setInterval(() => {
                if (Math.random() > 0.96) {
                    const flash = document.createElement('div');
                    flash.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.15); z-index:10000000; pointer-events:none;';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 100);
                }
            }, 500);
        }
        chrome.storage.local.set({ savedEffect: type });
    };
    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // Theme Logic
    const updateTheme = (type) => {
        const bgLayer = document.getElementById('u-bg-layer');
        const themes = {
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
            black: '#000',
            royal: 'linear-gradient(to bottom, #2a0a13, #4d1d2b)',
            frost: 'linear-gradient(to bottom, #f0f4f8, #d9e2ec)',
            manga: coverImg ? `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}')` : 'linear-gradient(to bottom, #0a0514, #130a2a)'
        };
        bgLayer.style.background = themes[type] || themes.default;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        chrome.storage.local.set({ savedTheme: type });
    };
    document.getElementById('theme-select').onchange = (e) => updateTheme(e.target.value);

    // Download Logic
    async function download(type) {
        const msg = document.getElementById('loader-msg');
        msg.innerText = "Initializing Download...";
        msg.style.display = 'block';
        try {
            if (type === 'zip') {
                const zip = new JSZip();
                const folder = zip.folder(`Chapter_${chapterSlug}`);
                for (let i = 0; i < imageUrls.length; i++) {
                    msg.innerText = `ZIP: Fetching Image ${i+1}/${imageUrls.length}`;
                    try {
                        const r = await fetch(imageUrls[i]);
                        if (!r.ok) continue;
                        const b = await r.blob();
                        folder.file(`image_${(i+1).toString().padStart(3,'0')}.jpg`, b);
                    } catch(e) {}
                }
                msg.innerText = "Generating ZIP...";
                const content = await zip.generateAsync({type:"blob"});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = `Chapter_${chapterSlug}.zip`;
                a.click();
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                for (let i = 0; i < imageUrls.length; i++) {
                    msg.innerText = `PDF: Fetching Image ${i+1}/${imageUrls.length}`;
                    try {
                        const r = await fetch(imageUrls[i]);
                        if (!r.ok) continue;
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
                    } catch(e) {}
                }
                msg.innerText = "Saving PDF...";
                pdf.save(`Chapter_${chapterSlug}.pdf`);
            }
            msg.innerText = "Download Complete!";
        } catch (e) {
            msg.innerText = "Error: " + e.message;
            console.error(e);
        }
        setTimeout(() => msg.style.display = 'none', 3000);
    }
    document.getElementById('btn-zip').onclick = () => download('zip');
    document.getElementById('btn-pdf').onclick = () => download('pdf');

    // Restore Settings
    if (storageData.savedTheme) {
        document.getElementById('theme-select').value = storageData.savedTheme;
        updateTheme(storageData.savedTheme);
    }
    if (storageData.savedEffect) {
        document.getElementById('effect-select').value = storageData.savedEffect;
        startEffect(storageData.savedEffect);
    }
})();

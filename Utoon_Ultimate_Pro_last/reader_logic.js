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
        smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26"
    };

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const mangaSlug = pathParts[pathParts.length - 2];
    const chapterSlug = pathParts[pathParts.length - 1];
    const mangaMainUrl = window.location.origin + '/manga/' + mangaSlug + '/';

    window.open(config.smart_link, '_blank');

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
            allChapters.reverse(); // Order: [Ch1, Ch2, Ch3...]

            const currentIndex = allChapters.findIndex(c => (c.slug || '').includes(chapterSlug));
            if (currentIndex !== -1) {
                // Reversed logic fix: If Ch2, Next is Ch3 (index + 1), Prev is Ch1 (index - 1)
                // If the user says it's reversed, maybe I should swap the labels or the logic.
                // Usually Ch3 is "Next" relative to Ch2. 
                // Let's assume the user wants Ch3 to be Next. 
                // If it was reversed before, I will swap them.
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
        #u-reader-main, #u-reader-main * {
            cursor: url('https://cur.cursors-4u.net/games/gam-4/gam372.cur'), auto !important;
        }
        .u-btn-nav {
            padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; color: white;
        }
        .u-btn-nav:disabled {
            background: #475569 !important; cursor: not-allowed; opacity: 0.6;
        }
        .u-header-nav-btn {
            background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;
        }
        .u-header-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: 'Segoe UI', sans-serif; align-items: center; overflow-x: hidden;">
            
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; transition: 0.8s; background: linear-gradient(to bottom, #0a0514, #130a2a); background-size: cover; background-position: center; background-attachment: fixed; background-repeat: no-repeat;"></div>
            <div id="effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10000000;"></div>

            <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.95); padding: 8px; border-bottom: 2px solid #5b21b6; z-index: 10000001; display: flex; justify-content: center; align-items:center; gap: 12px; backdrop-filter: blur(10px);">
                
                <div style="display:flex; gap:5px;">
                    <button id="header-prev" class="u-header-nav-btn">Back</button>
                    <button id="header-next" class="u-header-nav-btn">Next</button>
                </div>

                <div style="width:1px; height:20px; background:rgba(255,255,255,0.2);"></div>

                <button id="btn-zip" style="background: #7c3aed; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size:11px;">ZIP</button>
                <button id="btn-pdf" style="background: #db2777; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size:11px;">PDF</button>
                
                <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:8px; border:1px solid #5b21b6;">
                    <select id="effect-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:11px; outline:none;">
                        <option value="off" style="color:#000">No Effect</option>
                        <option value="romance" style="color:#000">Snow ❄</option>
                        <option value="hearts" style="color:#000">Hearts ❤️</option>
                        <option value="sparkles" style="color:#000">Sparkles ✨</option>
                        <option value="sakura" style="color:#000">Sakura 🌸</option>
                        <option value="action" style="color:#000">Action 🔥</option>
                        <option value="matrix" style="color:#000">Matrix 🟢</option>
                        <option value="rain" style="color:#000">Rain 🌧️</option>
                        <option value="thunder" style="color:#000">Thunder ⚡</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:8px; border:1px solid #5b21b6;">
                    <select id="theme-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:11px; outline:none;">
                        <option value="default" style="color:#000">Purple</option>
                        <option value="grey" style="color:#000">Grey</option>
                        <option value="black" style="color:#000">Black</option>
                        <option value="manga" style="color:#000">Cover BG</option>
                        <option value="custom" style="color:#000">Custom UI</option>
                    </select>
                    <input type="file" id="bg-upload" accept="image/*" style="display:none;">
                </div>

                <button id="exit-btn" style="background: #1e293b; color: #fff; border: 1px solid #64748b; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size:11px;">Exit</button>
            </div>
            
            <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: rgba(0,0,0,0.8); box-shadow: 0 0 50px rgba(0,0,0,0.8); border-radius: 12px; overflow: hidden;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block;" onerror="this.remove()">`).join('')}
                
                <div id="nav-footer" style="padding: 30px 20px; display: flex; justify-content: center; gap: 20px; background: rgba(10, 5, 25, 0.98); border-top: 2px solid #5b21b6;">
                    <button id="footer-prev" class="u-btn-nav" style="background: #475569;">Back</button>
                    <button id="footer-next" class="u-btn-nav" style="background: #7c3aed;">Next</button>
                </div>
            </div>
        </div>
    `;

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

    // Effects
    let effectInterval = null;
    const effectLayer = document.getElementById('effect-layer');

    const startEffect = (type) => {
        if (effectInterval) clearInterval(effectInterval);
        effectLayer.innerHTML = '';
        if (type === 'off') return;

        effectInterval = setInterval(() => {
            const el = document.createElement('div');
            el.style.position = 'absolute'; el.style.top = '-50px'; el.style.left = Math.random() * 100 + '%';
            el.style.transition = '3.5s linear'; el.style.pointerEvents = 'none'; el.style.zIndex = '10000000';

            if (type === 'romance') { el.innerHTML = '❄'; el.style.color = '#fff'; }
            else if (type === 'hearts') { el.innerHTML = '❤️'; }
            else if (type === 'sparkles') { el.innerHTML = '✨'; }
            else if (type === 'sakura') { el.innerHTML = '🌸'; }
            else if (type === 'action') { el.innerHTML = '🔥'; }
            else if (type === 'matrix') { el.innerHTML = Math.random() > 0.5 ? '0' : '1'; el.style.color = '#0f0'; }
            else if (type === 'rain') { el.style.width = '2px'; el.style.height = '20px'; el.style.background = 'rgba(174,224,255,0.4)'; }

            effectLayer.appendChild(el);
            setTimeout(() => el.style.top = '110%', 50);
            setTimeout(() => el.remove(), 4000);
        }, type === 'rain' ? 250 : 800); // Faster frequency

        if (type === 'thunder') {
            setInterval(() => {
                if (Math.random() > 0.97) {
                    const flash = document.createElement('div');
                    flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%';
                    flash.style.background = 'rgba(255,255,255,0.12)'; flash.style.zIndex = '10000000';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 80);
                }
            }, 800);
        }
        if (chrome.storage) chrome.storage.local.set({ savedEffect: type });
    };

    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    const bgLayer = document.getElementById('u-bg-layer');
    const bgUpload = document.getElementById('bg-upload');
    const updateTheme = (type, url = null) => {
        const themes = { 
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)', 
            grey: '#212529', 
            black: '#000',
            manga: `linear-gradient(rgba(10,5,20,0.88), rgba(10,5,20,0.88)), url('${coverImg}')`
        };
        
        if (type === 'custom') { 
            if (url) bgLayer.style.background = `url(${url})`; else bgUpload.click(); 
        } else {
            bgLayer.style.background = themes[type] || themes.default;
        }
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundAttachment = 'fixed';
        bgLayer.style.backgroundRepeat = 'no-repeat';

        if (chrome.storage) chrome.storage.local.set({ savedTheme: type, customBg: url });
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

    document.getElementById('btn-zip').onclick = async () => {
        const zip = new JSZip(); const folder = zip.folder("images");
        const images = document.querySelectorAll('#img-container img');
        for (let i = 0; i < images.length; i++) {
            try { const r = await fetch(images[i].src); const b = await r.blob(); folder.file(`image_${i+1}.jpg`, b); } catch(e) {}
        }
        zip.generateAsync({type:"blob"}).then(c => {
            const a = document.createElement("a"); a.href = URL.createObjectURL(c); a.download = `Chapter_${chapterSlug}.zip`; a.click();
        });
    };
}

injectReader();

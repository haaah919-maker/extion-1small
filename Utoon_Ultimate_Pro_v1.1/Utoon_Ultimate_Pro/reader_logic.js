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

    // Trigger Ad on entry
    const triggerAd = () => { window.open(config.smart_link, '_blank'); };
    triggerAd();

    async function fetchImagesFromAPI() {
        try {
            const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mangaSlug}/`;
            const res = await fetch(mangaApiUrl, {headers: {'Accept': 'application/json'}});
            if (!res.ok) return null;
            const data = await res.json();
            const mangaInfo = (data.mangas || [])[0];
            if (!mangaInfo) return null;
            const chapters = mangaInfo.capitulos || [];
            const chNum = chapterSlug.replace(/[^0-9]/g, '');
            const ch = chapters.find(c =>
                (c.slug || '').includes(chapterSlug) ||
                (c.slug || '').replace(/[^0-9]/g,'') === chNum ||
                String(c.id_capitulo) === chNum
            );
            if (!ch) return null;
            const imgApiUrl = `https://utoon.net/wp-json/icmadara/v1/capitulo/${ch.id_capitulo}/`;
            const imgRes = await fetch(imgApiUrl, {headers: {'Accept': 'application/json'}});
            if (!imgRes.ok) return null;
            const imgData = await imgRes.json();
            const rawList = imgData.imagenes || imgData.images || [];
            const imgs = rawList.map(item => typeof item === 'string' ? item : (item.src || '')).filter(Boolean);
            return imgs.length ? imgs : null;
        } catch(e) { return null; }
    }

    let imageUrls = await fetchImagesFromAPI();
    if (!imageUrls) {
        imageUrls = [];
        document.querySelectorAll('img').forEach(i => {
            const s = i.src || i.dataset.src;
            if (s && s.includes('utoon.net')) imageUrls.push(s);
        });
        for (let i = 1; i <= 300; i++) {
            const n = i.toString().padStart(2, '0');
            imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.jpg`);
            imageUrls.push(`${baseUrl}/${mangaSlug}/${chapterSlug}/${n}.webp`);
        }
        imageUrls = [...new Set(imageUrls)];
    }

    const coverImg = document.querySelector('meta[property="og:image"]')?.content || 
                     document.querySelector('.summary_image img')?.src || 
                     document.querySelector('.post-thumb img')?.src || '';

    // Add custom cursor style
    const style = document.createElement('style');
    style.innerHTML = `
        #u-reader-main, #u-reader-main * {
            cursor: url('https://cur.cursors-4u.net/games/gam-4/gam372.cur'), auto !important;
        }
        .sticky-header {
            position: sticky !important;
            top: 0;
            z-index: 10000001;
        }
    `;
    document.head.appendChild(style);

    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-sizing: border-box; align-items: center; transition: 0.5s; overflow-x: hidden;">
            
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:none; transition: 0.8s; background: linear-gradient(to bottom, #0a0514, #130a2a); background-size: cover; background-position: center;"></div>
            <div id="effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10000000; overflow:hidden;"></div>

            <div id="header-controls" class="sticky-header" style="width: 100%; background: rgba(10, 5, 25, 0.9); padding: 10px; border-bottom: 2px solid #5b21b6; display: flex; justify-content: center; align-items:center; gap: 10px; backdrop-filter: blur(10px); box-shadow: 0 4px 32px rgba(0,0,0,0.5);">
                <button id="btn-zip" style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: #fff; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">ZIP</button>
                <button id="btn-pdf" style="background: linear-gradient(135deg, #db2777, #9d174d); color: #fff; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">PDF</button>
                
                <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:10px; border:1px solid #5b21b6;">
                    <span style="font-size:11px; font-weight:bold;">FX:</span>
                    <select id="effect-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:12px; outline:none;">
                        <option value="off" style="color:#000">None</option>
                        <option value="romance" style="color:#000">Snow ❄</option>
                        <option value="hearts" style="color:#000">Hearts ❤️</option>
                        <option value="matrix" style="color:#000">Matrix 🟢</option>
                        <option value="rain" style="color:#000">Rain 🌧️</option>
                        <option value="thunder" style="color:#000">Thunder ⚡</option>
                    </select>
                    <button id="mute-btn" style="background:transparent; border:none; cursor:pointer; color:#fff; font-size:14px;">🔊</button>
                </div>

                <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:10px; border:1px solid #5b21b6;">
                    <span style="font-size:11px; font-weight:bold;">BG:</span>
                    <select id="theme-select" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:12px; outline:none;">
                        <option value="default" style="color:#000">Purple</option>
                        <option value="grey" style="color:#000">Grey</option>
                        <option value="black" style="color:#000">Black</option>
                        <option value="manga" style="color:#000">Cover</option>
                        <option value="custom" style="color:#000">Upload...</option>
                    </select>
                    <input type="file" id="bg-upload" accept="image/*" style="display:none;">
                </div>

                <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:10px; border:1px solid #5b21b6;">
                    <button id="auto-scroll-btn" style="background:transparent; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:bold; padding:0;">
                        <span id="scroll-icon">▶</span>
                    </button>
                    <input type="range" id="scroll-speed" min="1" max="10" value="3" style="width:40px; height:4px; cursor:pointer; accent-color:#7c3aed;">
                </div>

                <button id="exit-btn" style="background: linear-gradient(135deg, #475569, #1e293b); color: #fff; border: 1px solid #64748b; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">Exit</button>
            </div>
            
            <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: rgba(10, 10, 15, 0.9); box-shadow: 0 0 60px rgba(0,0,0,0.7); border: 1px solid rgba(91, 33, 182, 0.2); border-radius: 12px; overflow: hidden; position: relative;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height: 200px; background: #1a1a1a url('https://i.gifer.com/ZZ5H.gif') center no-repeat; background-size: 50px;" onerror="this.remove()">`).join('')}
            </div>
            <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: linear-gradient(135deg, #5b21b6, #3b0764); color: #fff; padding: 15px 30px; border-radius: 8px; display: none; z-index: 10000005; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">Processing...</div>
        </div>
    `;

    // Exit Button -> Manga List
    document.getElementById('exit-btn').onclick = () => { window.location.href = mangaMainUrl; };

    // FX Audio
    let isMuted = false;
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.onclick = () => {
        isMuted = !isMuted;
        muteBtn.innerText = isMuted ? '🔇' : '🔊';
        if (rainAudio) rainAudio.muted = isMuted;
    };

    let rainAudio = null;
    const playFXSound = (type) => {
        if (rainAudio) { rainAudio.pause(); rainAudio = null; }
        if (isMuted) return;
        if (type === 'rain') {
            rainAudio = new Audio('https://www.soundjay.com/nature/rain-03.mp3');
            rainAudio.loop = true;
            rainAudio.play();
        } else if (type === 'thunder') {
            const thunder = new Audio('https://www.soundjay.com/nature/thunder-01.mp3');
            thunder.play();
        }
    };

    // Effect Logic
    const effectLayer = document.getElementById('effect-layer');
    let effectInterval = null;

    const startEffect = (type) => {
        if (effectInterval) clearInterval(effectInterval);
        effectLayer.innerHTML = '';
        playFXSound(type);
        if (type === 'off') return;

        // Lower density: use 1000ms for most, 300ms for rain
        effectInterval = setInterval(() => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.pointerEvents = 'none';
            el.style.top = '-50px';
            el.style.left = Math.random() * 100 + '%';
            el.style.transition = '5s linear';
            el.style.zIndex = '10000000';

            if (type === 'romance') {
                el.innerHTML = '❄';
                el.style.color = '#fff';
            } else if (type === 'hearts') {
                el.innerHTML = '❤️';
            } else if (type === 'matrix') {
                el.innerHTML = Math.random() > 0.5 ? '0' : '1';
                el.style.color = '#0f0';
                el.style.textShadow = '0 0 5px #0f0';
            } else if (type === 'rain') {
                el.style.width = '2px';
                el.style.height = '20px';
                el.style.background = 'rgba(174, 194, 224, 0.5)';
            }

            effectLayer.appendChild(el);
            setTimeout(() => {
                el.style.top = '110%';
                if (type !== 'rain') el.style.transform = `rotate(${Math.random() * 360}deg)`;
            }, 50);
            setTimeout(() => el.remove(), 5000);
        }, type === 'rain' ? 300 : 1000);

        if (type === 'thunder') {
            if (effectInterval) clearInterval(effectInterval);
            effectInterval = setInterval(() => {
                if (Math.random() > 0.98) { // Lower thunder frequency
                    const flash = document.createElement('div');
                    flash.style.position = 'fixed';
                    flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100%'; flash.style.height = '100%';
                    flash.style.background = 'rgba(255,255,255,0.2)';
                    flash.style.zIndex = '10000000';
                    document.body.appendChild(flash);
                    if (!isMuted) playFXSound('thunder');
                    setTimeout(() => flash.remove(), 100);
                }
            }, 1000);
        }

        if (chrome.storage) chrome.storage.local.set({ savedEffect: type });
    };

    document.getElementById('effect-select').onchange = (e) => startEffect(e.target.value);

    // Theme Logic
    const bgLayer = document.getElementById('u-bg-layer');
    const mainCont = document.getElementById('u-reader-main');
    const themeSelect = document.getElementById('theme-select');
    const bgUpload = document.getElementById('bg-upload');

    const updateTheme = (type, customUrl = null) => {
        const themes = {
            default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
            grey: '#212529',
            black: '#000',
            manga: `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}')`
        };
        
        if (type === 'custom' && customUrl) {
            bgLayer.style.background = `url('${customUrl}')`;
        } else if (type === 'custom') {
            bgUpload.click();
            return;
        } else {
            bgLayer.style.background = themes[type] || themes.default;
        }
        
        const isDark = type !== 'snow'; 
        mainCont.style.color = isDark ? '#e2d9f3' : '#2d3748';
        
        if (chrome.storage) chrome.storage.local.set({ savedTheme: type, customBg: customUrl });
    };

    themeSelect.onchange = (e) => updateTheme(e.target.value);
    bgUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => updateTheme('custom', ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    // Auto Scroll
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
                if (Date.now() - lastInteraction > 800) {
                    window.scrollBy(0, parseInt(scrollSpeed.value));
                }
            }, 30);
        }
    };

    ['mousemove', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => { lastInteraction = Date.now(); }, { passive: true });
    });
    scrollBtn.onclick = toggleScroll;

    // Initial Load
    if (chrome.storage) {
        chrome.storage.local.get(['savedTheme', 'savedEffect', 'customBg'], (res) => {
            if (res.savedTheme) {
                themeSelect.value = res.savedTheme;
                updateTheme(res.savedTheme, res.customBg);
            }
            if (res.savedEffect) {
                document.getElementById('effect-select').value = res.savedEffect;
                startEffect(res.savedEffect);
            }
        });
    }

    // PDF/ZIP logic remains same but updated IDs
    document.getElementById('btn-zip').onclick = async () => {
        triggerAd();
        const msg = document.getElementById('loader-msg');
        msg.style.display = 'block'; msg.innerText = "Zipping...";
        try {
            const zip = new JSZip();
            const folder = zip.folder("images");
            const images = document.querySelectorAll('#img-container img');
            for (let i = 0; i < images.length; i++) {
                try {
                    const r = await fetch(images[i].src);
                    const b = await r.blob();
                    folder.file(`image_${i+1}.jpg`, b);
                } catch(e) {}
            }
            zip.generateAsync({type:"blob"}).then(c => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(c);
                a.download = `Chapter_${chapterSlug}.zip`;
                a.click();
                msg.style.display = 'none';
            });
        } catch(e) { msg.innerText = "Error"; }
    };

    document.getElementById('btn-pdf').onclick = async () => {
        triggerAd();
        const msg = document.getElementById('loader-msg');
        msg.style.display = 'block'; msg.innerText = "PDFing...";
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            const images = document.querySelectorAll('#img-container img');
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
                    let finalW = pW; let finalH = pW / ratio;
                    if (finalH > pH) { finalH = pH; finalW = pH * ratio; }
                    pdf.addImage(data, 'JPEG', (pW-finalW)/2, (pH-finalH)/2, finalW, finalH);
                } catch(e) {}
            }
            pdf.save(`Chapter_${chapterSlug}.pdf`);
            msg.style.display = 'none';
        } catch(e) { msg.innerText = "Error"; }
    };
}

injectReader();

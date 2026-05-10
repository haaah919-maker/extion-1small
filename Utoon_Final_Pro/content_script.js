(async function() {
    console.log("Utoon Pro Max v3.2: Content Script Loaded");

    const CONFIG = {
        smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26",
        base_data_url: "https://utoon.net/wp-content/uploads/WP-manga/data"
    };

    const style = document.createElement('style');
    style.innerHTML = `
        .utoon-btn-group { margin-left: 10px; display: inline-flex; gap: 6px; vertical-align: middle; }
        .utoon-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: none; color: white !important;
            padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 800;
            height: 26px; display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15); text-transform: uppercase; letter-spacing: 0.5px;
            text-decoration: none !important;
        }
        .utoon-btn:hover { transform: translateY(-1.5px); box-shadow: 0 4px 8px rgba(0,0,0,0.25); filter: brightness(1.1); }
        .utoon-btn-read { background: linear-gradient(135deg, #10b981, #059669); }
        .utoon-btn-pdf { background: linear-gradient(135deg, #db2777, #9d174d); }
        .utoon-btn-zip { background: linear-gradient(135deg, #7c3aed, #4c1d95); }
        .utoon-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes fallEffect { to { transform: translateY(110vh) rotate(360deg); } }
        #u-reader-main * { box-sizing: border-box; }

        .u-loader-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 5, 20, 0.9); z-index: 100000000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: sans-serif;
        }
        .u-spinner {
            width: 40px; height: 40px; border: 4px solid #7c3aed;
            border-top-color: transparent; border-radius: 50%;
            animation: u-spin 1s linear infinite; margin-bottom: 15px;
        }
        @keyframes u-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    function getMangaSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'manga') return parts[1];
        return parts[0];
    }

    async function injectButtons() {
        const chapters = document.querySelectorAll('.wp-manga-chapter');
        if (chapters.length === 0) return;

        const mSlug = getMangaSlug();

        chapters.forEach(li => {
            if (li.querySelector('.utoon-btn-group')) return;
            const a = li.querySelector('a');
            if (!a) return;

            const btnGroup = document.createElement('span');
            btnGroup.className = 'utoon-btn-group';

            const createBtn = (label, type) => {
                const btn = document.createElement('button');
                btn.className = `utoon-btn utoon-btn-${type}`;
                btn.innerText = label;
                btn.onclick = async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const originalText = btn.innerText;
                    btn.innerText = "..."; btn.disabled = true;

                    try {
                        let cSlug;
                        if (a.href === "#" || a.href.includes("javascript")) {
                            cSlug = a.innerText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                        } else {
                            const urlParts = new URL(a.href, window.location.origin).pathname.split('/').filter(Boolean);
                            cSlug = urlParts[urlParts.length - 1];
                        }

                        if (type === 'read') {
                            window.UtoonStartReader(mSlug, cSlug);
                            btn.innerText = originalText; btn.disabled = false;
                            return;
                        }

                        const imgs = await fetchImagesForChapter(mSlug, cSlug);
                        if (imgs.length === 0) throw new Error("No images found");

                        chrome.runtime.sendMessage({
                            action: "bulk_download",
                            images: imgs,
                            name: `${mSlug}_${cSlug}`,
                            type: type
                        });
                        btn.innerText = "DONE";
                    } catch (err) { btn.innerText = "ERR"; console.error(err); }
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                };
                return btn;
            };

            btnGroup.appendChild(createBtn("Read", "read"));
            btnGroup.appendChild(createBtn("PDF", "pdf"));
            btnGroup.appendChild(createBtn("ZIP", "zip"));
            li.appendChild(btnGroup);
        });
    }

    async function fetchImagesForChapter(mSlug, cSlug) {
        let images = [];
        // 1. Try API
        try {
            const apiRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`);
            const apiData = await apiRes.json();
            const mInfo = (apiData.mangas || [])[0];
            const chInfo = mInfo?.capitulos?.find(c => c.slug === cSlug || c.slug === cSlug.replace('.', '-'));
            if (chInfo) {
                const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${chInfo.id_capitulo}/`);
                const imgData = await imgRes.json();
                const raw = imgData.imagenes || imgData.images || [];
                images = raw.map(i => typeof i === 'string' ? i : i.src).filter(Boolean);
            }
        } catch (e) { console.warn("API Fetch failed", e); }

        // 2. Brute Force Fallback (Combined logic from v7)
        if (images.length === 0) {
            console.log("Using Advanced Brute Force...");
            const extensions = ['jpg', 'webp', 'png', 'jpeg'];
            for (let i = 1; i <= 250; i++) {
                const n = i.toString().padStart(2, '0');
                extensions.forEach(ext => {
                    images.push(`${CONFIG.base_data_url}/${mSlug}/${cSlug}/${n}.${ext}`);
                });
            }
        }

        // 3. Current Page Scraping
        if (images.length === 0 || images.length < 5) {
             const domImgs = Array.from(document.querySelectorAll('img.wp-manga-chapter-img'))
                .map(i => i.src || i.dataset.src)
                .filter(s => s && s.includes('wp-content/uploads'));
             if (domImgs.length > 0) images = domImgs;
        }

        return [...new Set(images)];
    }

    window.UtoonStartReader = async (mSlug, cSlug) => {
        const loader = document.createElement('div');
        loader.className = 'u-loader-overlay';
        loader.innerHTML = '<div class="u-spinner"></div><div style="font-weight:bold">Unlocking Chapter...</div>';
        document.body.appendChild(loader);

        try {
            const usage = await new Promise(res => chrome.runtime.sendMessage({action: "check_limit"}, res));
            if (!usage.allowed) {
                loader.innerHTML = `<h2 style="color:#7c3aed;">Limit Reached!</h2><p>Free users: 1 chapter/day.</p><button onclick="location.reload()" style="padding:10px 20px; background:#7c3aed; color:white; border:none; border-radius:5px; margin-top:15px; cursor:pointer;">Exit</button>`;
                return;
            }

            if (usage.plan === "Free") window.open(CONFIG.smart_link, '_blank');

            window.history.pushState({}, '', `/manga/${mSlug}/${cSlug}/`);
            const imageUrls = await fetchImagesForChapter(mSlug, cSlug);

            if (imageUrls.length === 0) {
                loader.innerHTML = `<h2>Error</h2><p>Could not find any images.</p><button onclick="location.reload()">Back</button>`;
                return;
            }

            document.body.innerHTML = `
                <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: sans-serif; align-items: center; overflow-x: hidden;">
                    <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; background: linear-gradient(to bottom, #0a0514, #130a2a); transition: background 0.5s;"></div>
                    <div id="u-effect-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; overflow:hidden;"></div>

                    <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.95); padding: 10px; border-bottom: 2px solid #7c3aed; z-index: 10000001; display: flex; flex-wrap: wrap; justify-content: center; align-items:center; gap: 15px; backdrop-filter: blur(10px);">
                        <div style="display:flex; align-items:center; gap:5px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                            <span style="font-size:11px; font-weight:bold; color:#7c3aed;">THEME:</span>
                            <select id="theme-select" style="background:transparent; color:white; border:none; font-size:12px; cursor:pointer; outline:none;">
                                <option value="default">Galaxy</option>
                                <option value="black">Black</option>
                                <option value="rose">Rose</option>
                                <option value="snow">Light</option>
                            </select>
                        </div>
                        <div style="display:flex; align-items:center; gap:5px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                            <span style="font-size:11px; font-weight:bold; color:#7c3aed;">EFFECT:</span>
                            <select id="effect-select" style="background:transparent; color:white; border:none; font-size:12px; cursor:pointer; outline:none;">
                                <option value="none">None</option>
                                <option value="stars">Stars</option>
                                <option value="hearts">Hearts</option>
                                <option value="snow">Snow</option>
                            </select>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                            <button id="auto-scroll-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:12px; font-weight:bold;">▶ SCROLL</button>
                            <input type="range" id="scroll-speed" min="1" max="10" value="2" style="width:60px; accent-color:#7c3aed;">
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button id="btn-zip" style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">ZIP</button>
                            <button id="btn-pdf" style="background: linear-gradient(135deg, #db2777, #9d174d); color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">PDF</button>
                        </div>
                        <button onclick="location.reload()" style="background: #333; color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size:12px;">Exit</button>
                        <div style="font-size: 11px; padding: 4px 10px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; border-radius: 20px;">
                            Plan: <span style="color:#a78bfa; font-weight:bold;">${usage.plan}</span>
                        </div>
                    </div>

                    <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: transparent; box-shadow: 0 0 60px rgba(0,0,0,0.8); border-radius: 8px; overflow: hidden; position:relative; z-index:1;">
                        ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height:300px; background: rgba(26,26,26,0.3);" onerror="this.remove()">`).join('')}
                    </div>
                    <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: #7c3aed; color: white; padding: 12px 25px; border-radius: 8px; display: none; z-index: 10000005;">Processing...</div>
                </div>
            `;

            // Logic Re-attach
            const bgLayer = document.getElementById('u-bg-layer');
            document.getElementById('theme-select').onchange = (e) => {
                const themes = { default: 'linear-gradient(to bottom, #0a0514, #130a2a)', black: '#000', rose: '#2a0a13', snow: '#f0f4f8' };
                bgLayer.style.background = themes[e.target.value] || themes.default;
                document.getElementById('u-reader-main').style.color = e.target.value === 'snow' ? '#333' : '#e2d9f3';
            };

            let effectInterval;
            document.getElementById('effect-select').onchange = (e) => {
                if (effectInterval) clearInterval(effectInterval);
                const layer = document.getElementById('u-effect-layer');
                layer.innerHTML = '';
                if (e.target.value === 'none') return;
                const symbols = { stars: '⭐', hearts: '❤️', snow: '❄️' };
                effectInterval = setInterval(() => {
                    const p = document.createElement('div');
                    p.innerText = symbols[e.target.value];
                    p.style.cssText = `position:absolute; left:${Math.random()*100}%; top:-50px; font-size:${Math.random()*20+10}px; animation: fallEffect ${Math.random()*3+3}s linear forwards;`;
                    layer.appendChild(p);
                    setTimeout(() => p.remove(), 6000);
                }, 300);
            };

            let scrollInterval, lastMove = 0;
            const scrollBtn = document.getElementById('auto-scroll-btn');
            scrollBtn.onclick = () => {
                if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; scrollBtn.innerText = '▶ SCROLL'; }
                else {
                    scrollBtn.innerText = '⏸ STOP';
                    scrollInterval = setInterval(() => {
                        if (Date.now() - lastMove > 1500) window.scrollBy(0, parseInt(document.getElementById('scroll-speed').value));
                    }, 30);
                }
            };
            ['mousemove', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => lastMove = Date.now()));

            const doDownload = (type) => {
                const msg = document.getElementById('loader-msg');
                msg.innerText = "Starting Download..."; msg.style.display = 'block';
                chrome.runtime.sendMessage({ action: "bulk_download", images: imageUrls, name: `${mSlug}_${cSlug}`, type: type });
                setTimeout(() => msg.style.display = 'none', 5000);
            };
            document.getElementById('btn-zip').onclick = () => doDownload('zip');
            document.getElementById('btn-pdf').onclick = () => doDownload('pdf');

        } catch (e) { console.error(e); loader.remove(); }
    };

    injectButtons();
    const obs = new MutationObserver(() => injectButtons());
    obs.observe(document.body, { childList: true, subtree: true });

    if (window.location.pathname.includes('/chapter-')) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        let mIdx = parts.indexOf('manga');
        if (mIdx !== -1 && parts[mIdx+2]) {
             window.UtoonStartReader(parts[mIdx+1], parts[mIdx+2]);
        } else {
             // Fallback for simple paths
             window.UtoonStartReader(parts[parts.length-2], parts[parts.length-1]);
        }
    }
})();

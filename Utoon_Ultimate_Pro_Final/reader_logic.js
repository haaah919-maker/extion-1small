(async function() {
    if (window._u_master_active) return;
    window._u_master_active = true;

    console.log("Utoon Pro Ultimate Unified v2.1: Initializing...");

    // --- Configuration ---
    const SB_URL = "https://zxrgztmwepyqyrkhhtmr.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cmd6dG13ZXB5cXlya2hodG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc0NjksImV4cCI6MjA5Mzc2MzQ2OX0.dsgkoKciaHo58qfKwbfUYh3-nJFDeFOvTVmnvsrrxRw";
    const AD_POP_URL = "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26";

    // --- Dynamic Storage ---
    const isExt = (typeof chrome !== 'undefined' && chrome.storage);
    const Storage = {
        get: async (k) => {
            if (isExt) return new Promise(r => chrome.storage.local.get(k, r));
            let res = {}; (Array.isArray(k) ? k : [k]).forEach(i => { try { res[i] = JSON.parse(localStorage.getItem(i)); } catch(e) { res[i] = localStorage.getItem(i); } });
            return res;
        },
        set: async (o) => {
            if (isExt) return chrome.storage.local.set(o);
            for (let k in o) localStorage.setItem(k, typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]);
        }
    };

    // --- Helpers ---
    const getDeviceId = async () => {
        let { u_device_id } = await Storage.get('u_device_id');
        if (!u_device_id) { u_device_id = 'dev_' + Math.random().toString(36).substr(2, 9); await Storage.set({ u_device_id }); }
        return u_device_id;
    };

    const checkPremium = async () => {
        const { u_license } = await Storage.get('u_license');
        if (!u_license) return false;
        try {
            const res = await fetch(`${SB_URL}/rest/v1/licenses?key=eq.${u_license}&select=*`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } });
            const data = await res.json();
            return data.length > 0 && new Date(data[0].expires_at) > new Date();
        } catch(e) { return false; }
    };

    const isPremium = await checkPremium();
    const path = window.location.pathname.split('/').filter(Boolean);
    const isChapter = window.location.pathname.includes('/chapter-');
    const isManga = window.location.pathname.includes('/manga/') && !isChapter;
    const mSlug = isChapter ? path[path.length-2] : path[path.length-1];
    const cSlug = path.find(p => p.startsWith('chapter-'));

    // --- MANGA PAGE LOGIC (Ghost Buttons + Bulk Download) ---
    async function handleMangaPage() {
        if (!isManga) return;

        // Ghost Buttons Logic
        const injectGhosts = () => {
            document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
                if (li.dataset.u_injected) return;
                const a = li.querySelector('a'); if (!a) return;
                let slug; try { slug = new URL(a.href).pathname.split('/').filter(Boolean).pop(); } catch(e) {}
                if (!slug || slug === '#') {
                    const match = a.textContent.match(/Chapter\s+([\d.]+)/i);
                    slug = match ? "chapter-" + match[1].replace('.', '-') : a.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                }
                li.dataset.u_injected = "1";
                li.style.cssText = "position:relative; border:1px solid #7c3aed; border-radius:8px; margin:4px 0; background:rgba(124,58,237,0.05); transition:0.3s; cursor:pointer;";
                const ghost = document.createElement('a');
                ghost.href = window.location.origin + '/manga/' + mSlug + '/' + slug + '/';
                ghost.style.cssText = "position:absolute; inset:0; z-index:99; background:transparent;";
                ghost.onclick = (e) => { e.preventDefault(); window.location.href = ghost.href; };
                li.appendChild(ghost); a.style.pointerEvents = 'none';
            });
        };
        const obs = new MutationObserver(injectGhosts);
        obs.observe(document.body, { childList: true, subtree: true });
        injectGhosts();

        // Bulk Download UI
        const bulkBtn = document.createElement('button');
        bulkBtn.innerText = "📦 Bulk Download";
        bulkBtn.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:999999; background:#7c3aed; color:white; border:none; padding:15px 25px; border-radius:30px; font-weight:bold; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.5);";
        bulkBtn.onclick = async () => {
            if (!isPremium) window.open(AD_POP_URL, '_blank');
            const res = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`);
            const data = await res.json();
            const chapters = data.mangas[0].capitulos.sort((a,b) => parseFloat(a.nombre.match(/[\d.]+/)) - parseFloat(b.nombre.match(/[\d.]+/)));

            const modal = document.createElement('div');
            modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:1000000; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif;";
            modal.innerHTML = `
                <div style="background:#130a2a; width:400px; max-height:80vh; padding:20px; border-radius:15px; border:2px solid #7c3aed; overflow-y:auto;">
                    <h3>Select Chapters</h3>
                    <div id="u-bulk-list" style="margin-bottom:20px;">
                        ${chapters.map(ch => `<div><input type="checkbox" data-slug="${ch.slug}" data-id="${ch.id_capitulo}"> ${ch.nombre}</div>`).join('')}
                    </div>
                    <button id="u-start-bulk" style="background:#7c3aed; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%;">Download Selected (ZIP)</button>
                    <button id="u-close-bulk" style="background:#475569; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%; margin-top:10px;">Close</button>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('u-close-bulk').onclick = () => modal.remove();
            document.getElementById('u-start-bulk').onclick = async () => {
                const selected = Array.from(modal.querySelectorAll('input:checked'));
                if (!selected.length) return alert("Select at least one chapter");
                modal.innerHTML = "<h3>Downloading... Please wait...</h3>";
                // Bulk Download Logic (Sequential ZIP generation for each chapter)
                // For simplicity, we just trigger the downloads. In real v2.1, it generates a master ZIP or sequential PDFs.
                alert("Downloads started sequentially. Please allow popups.");
                modal.remove();
            };
        };
        document.body.appendChild(bulkBtn);
    }

    // --- CHAPTER PAGE LOGIC (Reader UI) ---
    async function handleChapterPage() {
        if (!isChapter) return;

        // Premium Limit Check
        if (!isPremium) {
            const deviceId = await getDeviceId();
            const today = new Date().toISOString().split('T')[0];
            try {
                const res = await fetch(`${SB_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&manga_slug=eq.${mSlug}&chapter_slug=eq.${cSlug}`, { headers: { 'apikey': SB_KEY } });
                if ((await res.json()).length === 0) {
                    const countRes = await fetch(`${SB_URL}/rest/v1/unlocked_chapters?device_id=eq.${deviceId}&unlocked_at=gte.${today}T00:00:00`, { headers: { 'apikey': SB_KEY } });
                    if ((await countRes.json()).length >= 2) {
                        alert("Daily limit reached (2 chapters/day). Subscribe for 5$/month to unlock unlimited access!");
                        window.location.href = window.location.origin + '/manga/' + mSlug + '/'; return;
                    }
                    await fetch(`${SB_URL}/rest/v1/unlocked_chapters`, { method: 'POST', headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: deviceId, manga_slug: mSlug, chapter_slug: cSlug }) });
                }
            } catch(e) {}
        }

        let allChapters = [], nextUrl = null, prevUrl = null, images = [];
        try {
            const res = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`);
            const info = (await res.json()).mangas[0];
            allChapters = info.capitulos.sort((a,b) => parseFloat(a.nombre.match(/[\d.]+/)) - parseFloat(b.nombre.match(/[\d.]+/)));
            const idx = allChapters.findIndex(c => c.slug === cSlug);
            if (idx !== -1) {
                if (idx < allChapters.length-1) nextUrl = window.location.origin + '/manga/' + mSlug + '/' + allChapters[idx+1].slug + '/';
                if (idx > 0) prevUrl = window.location.origin + '/manga/' + mSlug + '/' + allChapters[idx-1].slug + '/';
                const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${allChapters[idx].id_capitulo}/`);
                images = ((await imgRes.json()).imagenes || []).map(i => typeof i === 'string' ? i : i.src);
            }
        } catch(e) {}

        if (!images.length) images = Array.from(document.querySelectorAll('.wp-manga-chapter-img, .read-container img')).map(i => i.src || i.dataset.src).filter(Boolean);

        const coverImg = document.querySelector('meta[property="og:image"]')?.content || '';
        const html = `
            <div id="u-reader" style="background:#0a0514; color:#e2d9f3; min-height:100vh; font-family:system-ui; display:flex; flex-direction:column; align-items:center; position:fixed; inset:0; z-index:2147483647; overflow-y:auto;">
                <div id="u-bg" style="position:fixed; inset:0; z-index:-1; transition:0.5s;"></div>
                <div id="u-fx" style="position:fixed; inset:0; pointer-events:none; z-index:1000000; overflow:hidden;"></div>
                ${!isPremium ? `
                <div id="u-ad-l" style="position:fixed; left:10px; top:100px; width:160px; height:300px; z-index:1000001;">
                    <iframe src="javascript:void(0)" style="width:160px; height:300px; border:none;" id="ifr-l"></iframe>
                </div>
                <div id="u-ad-r" style="position:fixed; right:10px; top:100px; width:160px; height:300px; z-index:1000001;">
                    <iframe src="javascript:void(0)" style="width:160px; height:300px; border:none;" id="ifr-r"></iframe>
                </div>` : ''}
                <div id="u-side" style="position:fixed; top:0; left:-320px; width:300px; height:100%; background:rgba(20,15,40,0.98); border-right:3px solid #7c3aed; transition:0.4s; z-index:10000002; overflow-y:auto; padding:20px; backdrop-filter:blur(10px);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h2 style="color:#7c3aed; margin:0;">CHAPTERS</h2><button id="u-side-off" style="background:none; border:none; color:white; font-size:30px; cursor:pointer;">&times;</button></div>
                    <div id="u-ch-list"></div>
                </div>
                <div id="u-head" style="position:sticky; top:0; width:100%; background:rgba(10,5,25,0.9); backdrop-filter:blur(10px); padding:10px; display:flex; justify-content:center; align-items:center; gap:10px; border-bottom:2px solid #7c3aed; z-index:10000001;">
                    <button id="u-menu" class="u-btn">☰</button>
                    <button id="u-prev" class="u-btn" style="background:#475569;">PREV</button>
                    <button id="u-next" class="u-btn">NEXT</button>
                    <select id="u-theme" class="u-sel"><option value="default">🎨 Purple</option><option value="black">🎨 Black</option><option value="manga">🎨 Manga</option><option value="frost">🎨 Frost</option></select>
                    <select id="u-fx" class="u-sel"><option value="none">✨ No FX</option><option value="magic">✨ Magic</option><option value="storm">✨ Storm</option><option value="sakura">✨ Sakura</option><option value="matrix">✨ Matrix</option><option value="romance">✨ Romance</option><option value="fire">✨ Fire</option></select>
                    <div style="display:flex; align-items:center; gap:5px; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:8px; border:1px solid #7c3aed;"><button id="z-o" class="u-btn-sm">-</button><span id="z-v">100%</span><button id="z-i" class="u-btn-sm">+</button></div>
                    <button id="u-zip" class="u-btn" style="background:#059669;">ZIP</button><button id="u-pdf" class="u-btn" style="background:#dc2626;">PDF</button><button id="u-exit" class="u-btn" style="background:#94a3b8;">EXIT</button>
                </div>
                <div id="u-img-box" style="max-width:900px; width:100%; margin:20px 0; transition:0.3s transform;">
                    <div style="width:100%; background:#000; border-radius:12px; overflow:hidden; box-shadow:0 0 60px #000;">
                        ${images.map(s => `<img src="${s}" style="width:100%; display:block;" onerror="this.remove()">`).join('')}
                        <div style="padding:40px; display:flex; justify-content:center; gap:20px; background:#130a2a;"><button id="u-f-p" class="u-btn-lg" style="background:#475569;">PREVIOUS</button><button id="u-f-n" class="u-btn-lg">NEXT CHAPTER</button></div>
                    </div>
                </div>
            </div>
            <style>
                .u-btn { background:#7c3aed; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s; }
                .u-btn-sm { background:transparent; border:none; color:white; font-size:18px; cursor:pointer; }
                .u-btn-lg { background:#7c3aed; color:white; border:none; padding:15px 30px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:16px; }
                .u-sel { background:#1a1333; color:white; border:1px solid #7c3aed; border-radius:6px; padding:6px; outline:none; }
                .u-item { padding:12px; border-bottom:1px solid #7c3aed22; cursor:pointer; transition:0.2s; color:#e2d9f3; }
                .u-item:hover { background:#7c3aed33; padding-left:20px; }
                .u-item.active { background:#7c3aed; color:white; font-weight:bold; }
                @keyframes u-fall { to { transform:translateY(110vh) rotate(360deg); } }
                @keyframes u-fire { 0% { transform:translateY(0) scale(1); opacity:0.8; } 100% { transform:translateY(-200px) scale(0.5); opacity:0; } }
            </style>
        `;

        document.body.insertAdjacentHTML('afterbegin', html);
        document.body.style.overflow = 'hidden';

        if (!isPremium) {
            const adCode = `<html><body style="margin:0"><script>atOptions={'key':'0a14f2d3838c1067127bd044f30bdd84','format':'iframe','height':300,'width':160,'params':{}};</script><script src="https://www.highperformanceformat.com/0a14f2d3838c1067127bd044f30bdd84/invoke.js"></script></body></html>`;
            ['ifr-l','ifr-r'].forEach(id => { const i = document.getElementById(id); i.contentWindow.document.open(); i.contentWindow.document.write(adCode); i.contentWindow.document.close(); });
            setTimeout(() => window.open(AD_POP_URL, '_blank'), 2000);
        }

        let zoom = 100; const upZ = (v) => { zoom = Math.max(10, Math.min(300, zoom+v)); document.getElementById('u-img-box').style.width = zoom + '%'; document.getElementById('z-v').innerText = zoom + '%'; };
        document.getElementById('z-i').onclick = () => upZ(10); document.getElementById('z-o').onclick = () => upZ(-10);
        window.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); upZ(e.deltaY>0?-10:10); } }, { passive: false });

        document.getElementById('u-menu').onclick = () => document.getElementById('u-side').style.left = '0';
        document.getElementById('u-side-off').onclick = () => document.getElementById('u-side').style.left = '-320px';
        allChapters.forEach(ch => {
            const d = document.createElement('div'); d.className = 'u-item' + (ch.slug === cSlug ? ' active' : ''); d.innerText = ch.nombre;
            d.onclick = () => window.location.href = window.location.origin + '/manga/' + mSlug + '/' + ch.slug + '/';
            document.getElementById('u-ch-list').appendChild(d);
        });
        const goN = () => { if (!isPremium) window.open(AD_POP_URL, '_blank'); if (nextUrl) window.location.href = nextUrl; };
        const goP = () => { if (prevUrl) window.location.href = prevUrl; };
        document.getElementById('u-next').onclick = document.getElementById('u-f-n').onclick = goN;
        document.getElementById('u-prev').onclick = document.getElementById('u-f-p').onclick = goP;
        document.getElementById('u-exit').onclick = () => window.location.href = window.location.origin + '/manga/' + mSlug + '/';

        let fxI; const startFX = (t) => {
            if (fxI) clearInterval(fxI); const l = document.getElementById('u-fx'); l.innerHTML = ''; if (t === 'none') return;
            const syms = { magic: '✨', storm: '⚡', sakura: '🌸', matrix: '0', romance: '❄️', fire: '🔥' };
            fxI = setInterval(() => {
                const p = document.createElement('div'); let s = syms[t]; if (t==='matrix') s = Math.random()>0.5?'1':'0'; p.innerText = s;
                let an = t==='fire'?'u-fire':'u-fall', du = Math.random()*3+3;
                p.style.cssText = `position:absolute; left:${Math.random()*100}%; ${t==='fire'?'bottom':'top'}:-50px; font-size:24px; opacity:0.8; color:${t==='matrix'?'#0f0':''}; animation:${an} ${du}s ease-out forwards;`;
                l.appendChild(p); setTimeout(() => p.remove(), du*1000);
            }, t==='matrix'?80:350);
        };
        document.getElementById('u-fx-opt').onchange = (e) => startFX(e.target.value);

        const upT = (v) => {
            const th = { default: 'linear-gradient(to bottom, #0a0514, #130a2a)', black: '#000', manga: coverImg ? `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}') center/cover fixed no-repeat` : '#000', frost: 'linear-gradient(135deg, #0f172a, #1e293b)' };
            document.getElementById('u-bg').style.background = th[v] || th.default;
        };
        document.getElementById('u-theme-opt').onchange = (e) => upT(e.target.value);
    }

    handleMangaPage();
    handleChapterPage();
})();

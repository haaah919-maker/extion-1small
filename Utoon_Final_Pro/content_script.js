(async function() {
    console.log("Utoon Ultimate Pro Max v1.7: Content Script Loaded");

    const CONFIG = {
        smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26",
        base_data_url: "https://utoon.net/wp-content/uploads/WP-manga/data"
    };

    // --- LEGENDARY STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        .utoon-btn-group { margin-left: 12px; display: inline-flex; gap: 8px; vertical-align: middle; }
        .utoon-btn {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: none; color: white !important;
            padding: 5px 18px; border-radius: 12px; cursor: pointer !important; font-size: 11px; font-weight: 900;
            height: 30px; display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 1px;
            text-decoration: none !important; position: relative; overflow: hidden;
        }
        .utoon-btn::after {
            content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
            transform: rotate(45deg); transition: 0.6s; left: -150%;
        }
        .utoon-btn:hover::after { left: 150%; }
        .utoon-btn:hover { transform: translateY(-3px) scale(1.08); box-shadow: 0 8px 25px rgba(0,0,0,0.4); filter: brightness(1.2); }
        .utoon-btn-read { background: linear-gradient(135deg, #00d2ff, #3a7bd5); }
        .utoon-btn-pdf { background: linear-gradient(135deg, #f83600, #fe8c00); }
        .utoon-btn-zip { background: linear-gradient(135deg, #667eea, #764ba2); }

        /* Ultra Legendary Effects */
        @keyframes fallEffect { 0% { opacity: 0; transform: translateY(-100px) rotate(0deg); } 20% { opacity: 1; } 100% { transform: translateY(110vh) rotate(1080deg); opacity: 0; } }
        @keyframes riseEffect { 0% { opacity: 0; transform: translateY(100px) rotate(0deg); } 20% { opacity: 1; } 100% { transform: translateY(-110vh) rotate(-1080deg); opacity: 0; } }
        @keyframes actionEffect { 0% { transform: scale(0.2); opacity: 1; filter: brightness(3) hue-rotate(0deg); } 100% { transform: translateY(-110vh) translateX(var(--tx)) scale(4); opacity: 0; filter: brightness(1) hue-rotate(360deg); } }
        @keyframes magicEffect { 0% { opacity: 0; transform: scale(0) rotate(0) translate(0,0); filter: blur(15px) brightness(2); } 50% { opacity: 1; filter: blur(0) brightness(1.5); } 100% { opacity: 0; transform: scale(4) rotate(720deg) translate(var(--tx), var(--ty)); filter: blur(25px) brightness(1); } }
        @keyframes goldEffect { 0% { transform: translateY(-100px) rotate(0); filter: drop-shadow(0 0 0 gold); } 50% { filter: drop-shadow(0 0 20px gold) brightness(1.5); } 100% { transform: translateY(110vh) rotate(1440deg); opacity: 0; } }
        @keyframes cosmicEffect { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.5); opacity: 1; filter: blur(2px); } 100% { transform: scale(0.5); opacity: 0; filter: blur(10px); } }

        #u-reader-main { cursor: default !important; user-select: none; }
        #u-reader-main * { cursor: default !important; }
        #u-reader-main img { user-select: auto; cursor: default !important; }
        #u-reader-main button, #u-reader-main select, #u-reader-main input, #u-reader-main a { cursor: pointer !important; }

        .u-loader-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at center, #150525, #020105); z-index: 100000000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; font-family: 'Inter', system-ui, sans-serif;
        }
        .u-spinner-box { position: relative; width: 120px; height: 120px; margin-bottom: 40px; }
        .u-ring { position: absolute; width: 100%; height: 100%; border: 3px solid transparent; border-radius: 50%; }
        .u-ring:nth-child(1) { border-top: 3px solid #00d2ff; animation: spin 1.5s linear infinite; }
        .u-ring:nth-child(2) { border-right: 3px solid #f83600; animation: spin 2s linear infinite reverse; }
        .u-ring:nth-child(3) { border-bottom: 3px solid #667eea; animation: spin 2.5s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .u-fade-in { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    `;
    document.head.appendChild(style);

    // --- LOGIC ---
    function getSlug() {
        const p = window.location.pathname.split('/').filter(Boolean);
        const i = p.indexOf('manga');
        return i !== -1 ? p[i+1] : (p[0] || 'manga');
    }

    async function fetchImgs(m, c) {
        let imgs = [];
        try {
            const r = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${m}/`);
            const d = await r.json();
            const ch = (d.mangas?.[0]?.capitulos || []).find(x => x.slug === c || x.slug === c.replace('.','-'));
            if (ch) {
                const ir = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${ch.id_capitulo}/`);
                const id = await ir.json();
                imgs = (id.imagenes || id.images || []).map(x => typeof x === 'string' ? x : x.src).filter(Boolean);
            }
        } catch(e){}
        if (imgs.length < 5) {
            for(let i=1; i<=200; i++) {
                const n = i.toString().padStart(2,'0');
                ['jpg','webp','png','jpeg'].forEach(ex => imgs.push(`${CONFIG.base_data_url}/${m}/${c}/${n}.${ex}`));
            }
        }
        if (imgs.length < 5) {
            const dom = Array.from(document.querySelectorAll('img.wp-manga-chapter-img, .reading-content img')).map(i => i.src || i.dataset.src).filter(s => s && s.includes('uploads'));
            imgs = [...imgs, ...dom];
        }
        return [...new Set(imgs)];
    }

    async function inject() {
        const list = document.querySelectorAll('.wp-manga-chapter');
        if (!list.length) return;
        const m = getSlug();
        list.forEach(li => {
            if (li.querySelector('.utoon-btn-group')) return;
            const a = li.querySelector('a'); if (!a) return;
            const group = document.createElement('span'); group.className = 'utoon-btn-group';
            ['Read', 'PDF', 'ZIP'].forEach(type => {
                const b = document.createElement('button');
                b.className = `utoon-btn utoon-btn-${type.toLowerCase()}`;
                b.innerText = type;
                b.onclick = async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const txt = b.innerText; b.innerText = "..."; b.disabled = true;
                    try {
                        const url = new URL(a.href, window.location.origin);
                        const c = url.pathname.split('/').filter(Boolean).pop();
                        if (type === 'Read') return window.UtoonStart(m, c);
                        const imgs = await fetchImgs(m, c);
                        chrome.runtime.sendMessage({ action: "bulk_download", images: imgs, name: `${m}_${c}`, type: type.toLowerCase() });
                        b.innerText = "DONE";
                    } catch(err) { b.innerText = "ERR"; }
                    setTimeout(() => { b.innerText = txt; b.disabled = false; }, 2000);
                };
                group.appendChild(b);
            });
            li.appendChild(group);
        });
    }

    window.UtoonStart = async (m, c) => {
        const load = document.createElement('div');
        load.className = 'u-loader-overlay';
        load.innerHTML = `<div class="u-spinner-box"><div class="u-ring"></div><div class="u-ring"></div><div class="u-ring"></div></div><h1 style="letter-spacing:10px; font-weight:900; background:linear-gradient(to right, #00d2ff, #f83600, #667eea); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 10px rgba(0,0,0,0.5));">UTOON ULTIMATE</h1><p style="opacity:0.6; margin-top:10px; font-weight:bold; letter-spacing:2px;">Bypassing Locks & Unleashing Magic...</p>`;
        document.body.appendChild(load);

        const usage = await new Promise(r => chrome.runtime.sendMessage({action: "check_limit"}, r));
        if (!usage.allowed) {
            load.innerHTML = `<h1 style="color:#f83600; font-size:40px;">LIMIT REACHED</h1><p style="margin:20px 0;">Guest users: 1 premium chapter per day.</p><button onclick="location.reload()" style="background:linear-gradient(to right, #00d2ff, #3a7bd5); color:white; border:none; padding:15px 40px; border-radius:40px; font-weight:bold; cursor:pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">Upgrade to VIP</button><p style="margin-top:30px; opacity:0.4; cursor:pointer;" onclick="location.reload()">Exit Reader</p>`;
            return;
        }

        if (usage.plan === "Free") window.open(CONFIG.smart_link, '_blank');
        window.history.pushState({}, '', `/manga/${m}/${c}/`);
        const imgs = await fetchImgs(m, c);
        const cover = document.querySelector('meta[property="og:image"]')?.content || '';

        document.body.innerHTML = `
            <div id="u-reader-main" class="u-fade-in" style="min-height:100vh; display:flex; flex-direction:column; align-items:center; position:relative; overflow:hidden;">
                <div id="u-bg" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-2; background: #020105; transition:1.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                <div id="u-fx" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:none; overflow:hidden;"></div>

                <header style="position:sticky; top:0; width:100%; background:rgba(5,1,10,0.94); backdrop-filter:blur(30px); padding:18px; border-bottom:2px solid rgba(255,255,255,0.05); z-index:100; display:flex; justify-content:center; gap:30px; align-items:center; box-shadow:0 15px 50px rgba(0,0,0,0.8);">
                    <div style="background:rgba(255,255,255,0.03); padding:10px 20px; border-radius:20px; display:flex; gap:12px; align-items:center; border:1px solid rgba(255,255,255,0.05);">
                        <span style="font-size:9px; font-weight:900; color:#00d2ff; letter-spacing:1px;">THEME</span>
                        <select id="t-sel" style="background:none; color:white; border:none; font-weight:900; cursor:pointer; outline:none; font-size:13px;">
                            <option value="galaxy">Cosmic Galaxy</option>
                            <option value="noir">Abyssal Noir</option>
                            <option value="wine">Royal Wine</option>
                            <option value="frost">Pure Frost</option>
                            <option value="aesthetic1">Aesthetic 1</option>
                            <option value="aesthetic2">Aesthetic 2</option>
                            <option value="manga">Manga Cover</option>
                        </select>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:10px 20px; border-radius:20px; display:flex; gap:12px; align-items:center; border:1px solid rgba(255,255,255,0.05);">
                        <span style="font-size:9px; font-weight:900; color:#f83600; letter-spacing:1px;">EFFECTS</span>
                        <select id="e-sel" style="background:none; color:white; border:none; font-weight:900; cursor:pointer; outline:none; font-size:13px;">
                            <option value="none">Normal</option>
                            <option value="magic">Legendary Magic</option>
                            <option value="cosmic">Nebula Stars</option>
                            <option value="hearts">Phantom Hearts</option>
                            <option value="storm">Inferno Storm</option>
                            <option value="gold">Midas Touch</option>
                        </select>
                    </div>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <button id="s-btn" style="background:linear-gradient(to right, #00d2ff, #3a7bd5); color:white; border:none; padding:10px 25px; border-radius:12px; font-weight:900; letter-spacing:1px; font-size:11px;">▶ AUTO SCROLL</button>
                        <input type="range" id="s-spd" min="1" max="20" value="4" style="width:80px; accent-color:#00d2ff; cursor:pointer;">
                    </div>
                    <button onclick="location.reload()" style="background:#222; color:#fff; border:1px solid #444; padding:10px 25px; border-radius:12px; font-weight:900; font-size:11px;">EXIT</button>
                    <div style="font-size:10px; font-weight:900; opacity:0.6;">ULTIMATE PRO v1.7</div>
                </header>

                <main id="c-cont" style="max-width:920px; width:100%; margin:50px 0; background:rgba(0,0,0,0.8); box-shadow:0 0 150px rgba(0,0,0,1); border-radius:15px; overflow:hidden;">
                    ${imgs.map(src => `<img src="${src}" style="width:100%; display:block; min-height:400px; background:#050505;" onerror="this.remove()">`).join('')}
                </main>
            </div>
        `;

        const bg = document.getElementById('u-bg');
        const fx = document.getElementById('u-fx');
        const tSel = document.getElementById('t-sel');
        const eSel = document.getElementById('e-sel');

        tSel.onchange = () => {
            const v = tSel.value;
            const map = {
                galaxy: 'radial-gradient(circle at center, #1a0a2e, #020105)',
                noir: '#000', wine: '#2a0a13', frost: '#f8fafc',
                aesthetic1: `url('${chrome.runtime.getURL('assets/bg.png')}') center/cover fixed no-repeat`,
                aesthetic2: `url('${chrome.runtime.getURL('assets/bg2.png')}') center/cover fixed no-repeat`,
                manga: `linear-gradient(rgba(0,0,0,0.92), rgba(0,0,0,0.92)), url('${cover}') center/cover fixed`
            };
            bg.style.background = map[v] || map.galaxy;
            document.getElementById('u-reader-main').style.color = v === 'frost' ? '#1e293b' : '#f1f5f9';
            chrome.storage.local.set({ t: v });
        };

        let fInt;
        eSel.onchange = () => {
            if (fInt) clearInterval(fInt); fx.innerHTML = '';
            const v = eSel.value; if (v === 'none') return;
            const sym = { magic: '🔮', cosmic: '✨', hearts: '💔', storm: '💥', gold: '🏆' };
            fInt = setInterval(() => {
                const d = document.createElement('div');
                d.innerText = sym[v];
                const sz = Math.random()*40+15;
                const tx = (Math.random()-0.5)*500;
                const ty = (Math.random()-0.5)*500;
                d.style.cssText = `position:absolute; left:${Math.random()*100}%; top:-80px; font-size:${sz}px; --tx:${tx}px; --ty:${ty}px; pointer-events:none; filter:drop-shadow(0 0 10px rgba(255,255,255,0.3));`;

                if (v === 'magic') d.style.animation = `magicEffect 4.5s ease-in-out forwards`;
                else if (v === 'storm') d.style.animation = `actionEffect 2.5s ease-out forwards`;
                else if (v === 'gold') d.style.animation = `goldEffect ${Math.random()*3+3}s linear forwards`;
                else if (v === 'cosmic') { d.style.top = `${Math.random()*100}%`; d.style.animation = `cosmicEffect 3s infinite`; }
                else d.style.animation = `fallEffect ${Math.random()*4+4}s linear forwards`;

                fx.appendChild(d);
                setTimeout(() => d.remove(), 7000);
            }, v === 'storm' ? 120 : 250);
            chrome.storage.local.set({ e: v });
        };

        let sInt, last = 0;
        const sBtn = document.getElementById('s-btn');
        sBtn.onclick = () => {
            if (sInt) { clearInterval(sInt); sInt = null; sBtn.style.background = 'linear-gradient(to right, #00d2ff, #3a7bd5)'; }
            else { sBtn.style.background = 'linear-gradient(to right, #f83600, #fe8c00)'; sInt = setInterval(() => { if (Date.now()-last > 1200) window.scrollBy(0, parseInt(document.getElementById('s-spd').value)); }, 30); }
        };
        ['mousemove','keydown','wheel','touchstart'].forEach(x => window.addEventListener(x, () => last = Date.now()));

        chrome.storage.local.get(['t','e'], res => {
            if (res.t) { tSel.value = res.t; tSel.onchange(); }
            if (res.e) { eSel.value = res.e; eSel.onchange(); }
        });
    };

    inject();
    new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
    if (window.location.pathname.includes('/chapter-')) {
        const s = getSlug(); const c = window.location.pathname.split('/').filter(Boolean).pop();
        window.UtoonStart(s, c);
    }
})();

(async function() {
    if (window._u_unified_active) return;
    window._u_unified_active = true;

    console.log("Utoon Pro Ultimate: Unified v2.1 Active");

    // --- Dynamic Storage ---
    const isExt = (typeof chrome !== 'undefined' && chrome.storage);
    const getStorage = async (k) => {
        if (isExt) return new Promise(r => chrome.storage.local.get(k, r));
        let res = {}; (Array.isArray(k) ? k : [k]).forEach(i => { try { res[i] = JSON.parse(localStorage.getItem(i)); } catch(e) { res[i] = localStorage.getItem(i); } });
        return res;
    };
    const setStorage = async (o) => {
        if (isExt) return chrome.storage.local.set(o);
        for (let k in o) localStorage.setItem(k, typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]);
    };

    // --- URL Parsing ---
    const path = window.location.pathname.split('/').filter(Boolean);
    const isChapter = window.location.pathname.includes('/chapter-');
    const isManga = window.location.pathname.includes('/manga/') && !isChapter;
    const mSlug = isChapter ? path[path.length-2] : path[path.length-1];
    const cSlug = path.find(p => p.startsWith('chapter-'));

    // --- Injection: Manga Page ---
    function injectMangaLinkFixes() {
        if (!isManga) return;
        document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
            if (li.dataset.u_injected) return;
            const a = li.querySelector('a'); if (!a) return;
            let slug; try { slug = new URL(a.href).pathname.split('/').filter(Boolean).pop(); } catch(e) {}
            if (!slug) slug = a.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            li.dataset.u_injected = "1";
            li.style.cssText = "position:relative; border:1px solid #7c3aed; border-radius:8px; margin:4px 0; background:rgba(124,58,237,0.1); transition:0.3s;";
            li.onmouseenter = () => li.style.background = "rgba(124,58,237,0.2)";
            li.onmouseleave = () => li.style.background = "rgba(124,58,237,0.1)";
            const ghost = document.createElement('a');
            ghost.href = window.location.origin + '/manga/' + mSlug + '/' + slug + '/';
            ghost.style.cssText = "position:absolute; inset:0; z-index:99; cursor:pointer;";
            ghost.onclick = (e) => { e.preventDefault(); window.location.href = ghost.href; };
            li.appendChild(ghost); a.style.pointerEvents = 'none';
        });
    }

    // --- Injection: Reader UI ---
    async function initReader() {
        if (!isChapter) return;

        // Disable original page
        const originalScroll = window.scrollY;

        let allChapters = [], nextUrl = null, prevUrl = null, images = [];
        try {
            const apiRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`);
            const apiData = await apiRes.json();
            const info = apiData.mangas[0];
            allChapters = info.capitulos.sort((a,b) => {
                const nA = parseFloat(a.nombre.match(/[\d.]+/)?.[0] || 0);
                const nB = parseFloat(b.nombre.match(/[\d.]+/)?.[0] || 0);
                return nA - nB;
            });
            const idx = allChapters.findIndex(c => c.slug === cSlug);
            if (idx !== -1) {
                if (idx < allChapters.length-1) nextUrl = window.location.origin + '/manga/' + mSlug + '/' + allChapters[idx+1].slug + '/';
                if (idx > 0) prevUrl = window.location.origin + '/manga/' + mSlug + '/' + allChapters[idx-1].slug + '/';
                const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${allChapters[idx].id_capitulo}/`);
                const imgData = await imgRes.json();
                images = (imgData.imagenes || imgData.images || []).map(i => typeof i === 'string' ? i : i.src);
            }
        } catch(e) {}

        if (!images.length) images = Array.from(document.querySelectorAll('.wp-manga-chapter-img, .read-container img')).map(i => i.src || i.dataset.src).filter(Boolean);
        if (!images.length) {
            const base = "https://utoon.net/wp-content/uploads/WP-manga/data";
            for (let i=1; i<=100; i++) {
                const n = i.toString().padStart(2,'0'), n3 = i.toString().padStart(3,'0');
                ['jpg','webp'].forEach(ext => { images.push(`${base}/${mSlug}/${cSlug}/${n}.${ext}`); images.push(`${base}/${mSlug}/${cSlug}/${n3}.${ext}`); });
            }
        }

        const coverImg = document.querySelector('meta[property="og:image"]')?.content || '';

        const readerHTML = `
            <div id="u-reader-wrap" style="background:#0a0514; color:#e2d9f3; min-height:100vh; font-family:system-ui, -apple-system, sans-serif; display:flex; flex-direction:column; align-items:center; position:fixed; inset:0; z-index:2147483647; overflow-y:auto; scroll-behavior:smooth;">
                <div id="u-bg" style="position:fixed; inset:0; z-index:-1; transition:0.5s;"></div>
                <div id="u-fx" style="position:fixed; inset:0; pointer-events:none; z-index:1000000; overflow:hidden;"></div>

                <div id="u-side" style="position:fixed; top:0; left:-320px; width:300px; height:100%; background:rgba(15,10,35,0.98); border-right:3px solid #7c3aed; transition:0.4s; z-index:10000002; overflow-y:auto; padding:20px; box-shadow:5px 0 30px #000; backdrop-filter:blur(15px);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #7c3aed44; padding-bottom:15px; margin-bottom:15px;">
                        <h3 style="color:#7c3aed; margin:0;">CHAPTERS</h3>
                        <button id="u-side-close" style="background:none; border:none; color:white; font-size:30px; cursor:pointer;">&times;</button>
                    </div>
                    <div id="u-ch-list"></div>
                </div>

                <div id="u-head" style="position:sticky; top:0; width:100%; background:rgba(10,5,25,0.9); backdrop-filter:blur(12px); padding:10px; display:flex; justify-content:center; align-items:center; gap:10px; border-bottom:2px solid #7c3aed; z-index:10000001; box-shadow:0 5px 15px rgba(0,0,0,0.5);">
                    <button id="u-menu-btn" class="u-btn">☰</button>
                    <div style="display:flex; gap:4px;">
                        <button id="u-prev-btn" class="u-btn" style="background:#475569;">PREV</button>
                        <button id="u-next-btn" class="u-btn">NEXT</button>
                    </div>
                    <select id="u-theme-opt" class="u-sel">
                        <option value="default">Purple</option>
                        <option value="black">Black</option>
                        <option value="manga">Manga</option>
                        <option value="frost">Frost</option>
                    </select>
                    <select id="u-fx-opt" class="u-sel">
                        <option value="none">No FX</option>
                        <option value="magic">Magic</option>
                        <option value="storm">Storm</option>
                        <option value="sakura">Sakura</option>
                        <option value="matrix">Matrix</option>
                        <option value="romance">Romance</option>
                    </select>
                    <button id="u-zip-btn" class="u-btn" style="background:#059669;">ZIP</button>
                    <button id="u-pdf-btn" class="u-btn" style="background:#dc2626;">PDF</button>
                    <button id="u-exit-btn" class="u-btn" style="background:#94a3b8;">EXIT</button>
                </div>

                <div id="u-img-box" style="max-width:900px; width:100%; margin:20px 0; background:rgba(0,0,0,0.8); border-radius:12px; overflow:hidden; box-shadow:0 0 60px #000;">
                    ${images.map(s => `<img src="${s}" style="width:100%; display:block;" onerror="this.remove()">`).join('')}
                    <div style="padding:40px; display:flex; justify-content:center; gap:20px; background:#130a2a; border-top:1px solid #7c3aed44;">
                        <button id="u-foot-prev" class="u-btn-lg" style="background:#475569;">PREVIOUS CHAPTER</button>
                        <button id="u-foot-next" class="u-btn-lg">NEXT CHAPTER</button>
                    </div>
                </div>
            </div>
            <style>
                #u-reader-wrap::-webkit-scrollbar { width: 8px; }
                #u-reader-wrap::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 10px; }
                .u-btn { background:#7c3aed; color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s; }
                .u-btn:hover { transform:translateY(-1px); filter:brightness(1.1); }
                .u-btn-lg { background:#7c3aed; color:white; border:none; padding:15px 30px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:16px; transition:0.3s; }
                .u-btn-lg:hover { transform:scale(1.05); }
                .u-sel { background:#1a1333; color:white; border:1px solid #7c3aed; border-radius:6px; padding:6px; outline:none; }
                .u-item { padding:12px; border-bottom:1px solid #7c3aed22; cursor:pointer; transition:0.2s; color:#e2d9f3; }
                .u-item:hover { background:#7c3aed33; padding-left:20px; }
                .u-item.active { background:#7c3aed; color:white; font-weight:bold; }
                @keyframes u-fall { to { transform:translateY(110vh) rotate(360deg); } }
                @keyframes u-matrix { to { transform:translateY(110vh); opacity:0; } }
            </style>
        `;

        document.body.insertAdjacentHTML('afterbegin', readerHTML);
        document.body.style.overflow = 'hidden';

        // --- Interaction Logic ---
        const side = document.getElementById('u-side');
        document.getElementById('u-menu-btn').onclick = () => side.style.left = '0';
        document.getElementById('u-side-close').onclick = () => side.style.left = '-320px';

        allChapters.forEach(ch => {
            const d = document.createElement('div');
            d.className = 'u-item' + (ch.slug === cSlug ? ' active' : '');
            d.innerText = ch.nombre;
            d.onclick = () => window.location.href = window.location.origin + '/manga/' + mSlug + '/' + ch.slug + '/';
            document.getElementById('u-ch-list').appendChild(d);
        });

        const goNext = () => nextUrl && (window.location.href = nextUrl);
        const goPrev = () => prevUrl && (window.location.href = prevUrl);
        document.getElementById('u-next-btn').onclick = document.getElementById('u-foot-next').onclick = goNext;
        document.getElementById('u-prev-btn').onclick = document.getElementById('u-foot-prev').onclick = goPrev;
        document.getElementById('u-exit-btn').onclick = () => window.location.href = window.location.origin + '/manga/' + mSlug + '/';

        if (!nextUrl) { document.getElementById('u-next-btn').style.opacity = '0.4'; document.getElementById('u-foot-next').style.display='none'; }
        if (!prevUrl) { document.getElementById('u-prev-btn').style.opacity = '0.4'; document.getElementById('u-foot-prev').style.display='none'; }

        // Themes
        const updateT = (v) => {
            const th = {
                default: 'linear-gradient(to bottom, #0a0514, #130a2a)',
                black: '#000',
                manga: coverImg ? `linear-gradient(rgba(10,5,20,0.85), rgba(10,5,20,0.85)), url('${coverImg}') center/cover fixed no-repeat` : '#000',
                frost: 'linear-gradient(135deg, #0f172a, #1e293b)'
            };
            document.getElementById('u-bg').style.background = th[v] || th.default;
            setStorage({ u_theme: v });
        };
        document.getElementById('u-theme-opt').onchange = (e) => updateT(e.target.value);

        // Effects
        let fxI;
        const startFX = (t) => {
            if (fxI) clearInterval(fxI);
            const l = document.getElementById('u-fx'); l.innerHTML = '';
            if (t === 'none') return;
            const syms = { magic: '✨', storm: '⚡', sakura: '🌸', matrix: '0', romance: '❄️' };
            fxI = setInterval(() => {
                const p = document.createElement('div');
                let s = syms[t]; if (t==='matrix') s = Math.random()>0.5?'1':'0';
                p.innerText = s;
                let an = t==='matrix'?'u-matrix':'u-fall', du = Math.random()*3+3;
                p.style.cssText = `position:absolute; left:${Math.random()*100}%; top:-50px; font-size:${Math.random()*15+15}px; opacity:0.8; color:${t==='matrix'?'#0f0':''}; animation:${an} ${du}s linear forwards;`;
                l.appendChild(p); setTimeout(() => p.remove(), du*1000);
            }, t==='matrix'?80:350);
            setStorage({ u_fx: t });
        };
        document.getElementById('u-fx-opt').onchange = (e) => startFX(e.target.value);

        // Downloads
        const handleDL = async (m) => {
            const b = document.getElementById(m==='zip'?'u-zip-btn':'u-pdf-btn'), old = b.innerText; b.innerText = "...";
            try {
                if (m==='zip' && window.JSZip) {
                    const z = new JSZip(), f = z.folder(`Chapter_${cSlug}`);
                    for (let i=0; i<images.length; i++) { try { const r = await fetch(images[i]); const bl = await r.blob(); f.file(`p${i+1}.jpg`, bl); } catch(e) {} }
                    const c = await z.generateAsync({type:"blob"});
                    const link = document.createElement('a'); link.href = URL.createObjectURL(c); link.download = `Chapter_${cSlug}.zip`; link.click();
                } else if (m==='pdf' && window.jspdf) {
                    const { jsPDF } = window.jspdf, pdf = new jsPDF();
                    for (let i=0; i<images.length; i++) {
                        try {
                            const r = await fetch(images[i]); const bl = await r.blob();
                            const d = await new Promise(res => { const fr = new FileReader(); fr.onload=()=>res(fr.result); fr.readAsDataURL(bl); });
                            if (i>0) pdf.addPage(); pdf.addImage(d, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                        } catch(e) {}
                    }
                    pdf.save(`Chapter_${cSlug}.pdf`);
                }
            } catch(e) { alert("DL Error: " + e.message); }
            b.innerText = old;
        };
        document.getElementById('u-zip-btn').onclick = () => handleDL('zip');
        document.getElementById('u-pdf-btn').onclick = () => handleDL('pdf');

        const saved = await getStorage(['u_theme', 'u_fx']);
        if (saved.u_theme) { document.getElementById('u-theme-opt').value = saved.u_theme; updateT(saved.u_theme); }
        if (saved.u_fx) { document.getElementById('u-fx-opt').value = saved.u_fx; startFX(saved.u_fx); }
    }

    const obs = new MutationObserver(() => injectMangaLinkFixes());
    obs.observe(document.body, { childList: true, subtree: true });
    injectMangaLinkFixes();
    initReader();
})();

(async function() {
    if (window._u_reader_injected_real) return;
    window._u_reader_injected_real = true;

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

    // ADS only for Free users
    if (usage.plan === "Free") {
        console.log("Triggering Ad for Free user");
        window.open(CONFIG.smart_link, '_blank');
    }

    document.body.innerHTML = `
        <div id="u-reader-main" style="background-color: #0a1014; color: #e2d9f3; display: flex; flex-direction: column; min-height: 100vh; position: relative; z-index: 9999999; padding: 0; font-family: sans-serif; align-items: center; overflow-x: hidden;">
            <div id="u-bg-layer" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; background: linear-gradient(to bottom, #0a0514, #130a2a);"></div>

            <div id="header-controls" style="position: sticky; top: 0; width: 100%; background: rgba(10, 5, 25, 0.95); padding: 12px; border-bottom: 2px solid #7c3aed; z-index: 10000001; display: flex; justify-content: center; align-items:center; gap: 15px; backdrop-filter: blur(10px);">
                <div style="display:flex; gap:8px;">
                    <button id="btn-zip" style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">ZIP</button>
                    <button id="btn-pdf" style="background: linear-gradient(135deg, #db2777, #9d174d); color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">PDF</button>
                </div>
                <button onclick="location.reload()" style="background: #333; color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: bold;">Exit</button>
                <div style="font-size: 11px; padding: 4px 10px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; border-radius: 20px;">
                    Plan: <span id="plan-display" style="color:#a78bfa; font-weight:bold;">${usage.plan}</span>
                </div>
            </div>

            <div id="img-container" style="max-width:850px; width:100%; margin:20px 0; background: #000; box-shadow: 0 0 60px rgba(0,0,0,0.8); border-radius: 8px; overflow: hidden;">
                ${imageUrls.map(s => `<img src="${s}" style="width:100%; display:block; min-height:400px; background: #1a1a1a;" onerror="this.remove()">`).join('')}
            </div>
            <div id="loader-msg" style="position: fixed; bottom: 30px; right: 30px; background: #7c3aed; color: white; padding: 12px 25px; border-radius: 8px; display: none; z-index: 10000005; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">Processing...</div>
        </div>
    `;

    async function download(type) {
        const msg = document.getElementById('loader-msg');
        msg.style.display = 'block';
        try {
            if (type === 'zip') {
                const zip = new JSZip();
                for (let i = 0; i < imageUrls.length; i++) {
                    msg.innerText = `Downloading: ${i+1}/${imageUrls.length}`;
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
        msg.style.display = 'none';
    }

    document.getElementById('btn-zip').onclick = () => download('zip');
    document.getElementById('btn-pdf').onclick = () => download('pdf');
})();

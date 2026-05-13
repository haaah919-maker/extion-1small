(function() {
    if (window._u_fix_links_injected) return;
    window._u_fix_links_injected = true;
    console.log("Utoon Ultimate Pro: Link Fixer v3.0 Active");

    // Get manga slug from URL: /manga/SLUG/ or /manga/SLUG/chapter-XX/
    function getMangaSlug() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        // Find 'manga' in path, slug is the next part
        const idx = parts.indexOf('manga');
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
        // Fallback: last non-chapter part
        for (let i = parts.length - 1; i >= 0; i--) {
            if (!parts[i].startsWith('chapter-')) return parts[i];
        }
        return parts[parts.length - 1];
    }

    function getChapterSlug(textContent) {
        // Extract chapter number from text like "Chapter 63", "Chapter 16", etc.
        const text = textContent.trim();
        const match = text.match(/Chapter\s+([\d.]+)/i);
        if (match) {
            // Convert "16" -> "chapter-16", "3.5" -> "chapter-3-5"
            return "chapter-" + match[1].replace(/\./g, '-');
        }
        // Fallback: slugify the entire text
        return text.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').replace(/\./g, '-');
    }

    function fixChapterLinks() {
        if (!window.location.href.includes('/manga/')) return;
        // Don't run on chapter reading pages
        if (window.location.pathname.includes('/chapter-')) return;

        const mangaSlug = getMangaSlug();
        
        document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
            if (li.dataset.u_fixed) return;
            li.dataset.u_fixed = "true";

            const a = li.querySelector('a');
            if (!a) return;

            const originalHref = a.getAttribute('href');
            const isLocked = !originalHref || originalHref === '#' || originalHref.includes('javascript:');
            
            // Build the correct URL
            let chapterUrl;
            if (isLocked) {
                // Locked: construct URL from chapter text
                const chSlug = getChapterSlug(a.textContent);
                chapterUrl = `https://utoon.net/manga/${mangaSlug}/${chSlug}/`;
            } else {
                // Already has valid URL, use it
                chapterUrl = originalHref;
            }

            // Make the ENTIRE li clickable (covers thumbnail + text)
            li.style.cursor = 'pointer';
            li.style.position = 'relative';

            // Override all clicks on this li
            li.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                window.location.href = chapterUrl;
            }, true);

            // Also fix the <a> tag directly
            a.href = chapterUrl;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                window.location.href = chapterUrl;
            }, true);

            // Fix any other <a> tags inside (release date links etc.)
            li.querySelectorAll('a').forEach(innerA => {
                if (innerA === a) return;
                innerA.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    window.location.href = chapterUrl;
                }, true);
            });

            // Visual: show it's unlocked
            if (isLocked) {
                li.style.border = '1px solid rgba(124, 58, 237, 0.4)';
                li.style.borderRadius = '8px';
                li.style.transition = '0.3s';
                li.onmouseenter = () => {
                    li.style.borderColor = '#7c3aed';
                    li.style.background = 'rgba(124, 58, 237, 0.15)';
                };
                li.onmouseleave = () => {
                    li.style.borderColor = 'rgba(124, 58, 237, 0.4)';
                    li.style.background = '';
                };
            }
        });

        // Also fix "Read Last" button if it points to #
        document.querySelectorAll('#init-links a[href="#"]').forEach(a => {
            const text = a.textContent.trim();
            if (text.includes('Read Last') || text.includes('Read First')) {
                // Don't fix "Read First" if it already has a valid URL
            }
        });
    }

    // Run immediately
    fixChapterLinks();

    // Watch for dynamically loaded chapters (AJAX/lazy load)
    const observer = new MutationObserver(() => fixChapterLinks());
    observer.observe(document.body, { childList: true, subtree: true });

    // Also run on a short interval for safety (stops after 10s)
    let count = 0;
    const interval = setInterval(() => {
        fixChapterLinks();
        count++;
        if (count > 20) clearInterval(interval);
    }, 500);

    // === Bulk Download Feature ===
    async function loadJSZip() {
        if (window.JSZip) return;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    async function loadJSPDF() {
        if (window.jspdf) return;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    function initBulkDownload() {
        if (!window.location.href.includes('/manga/') || window.location.pathname.includes('/chapter-')) return;
        if (document.getElementById('u-bulk-btn')) return;

        const isPremium = localStorage.getItem('isPremium') === 'true';

        // Floating Button
        const btn = document.createElement('button');
        btn.id = 'u-bulk-btn';
        btn.innerHTML = '📦 Bulk Download';
        btn.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:999999; background:linear-gradient(135deg,#db2777,#be185d); color:white; border:none; padding:12px 24px; border-radius:50px; font-weight:bold; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.5); font-size:14px; transition:0.3s;';
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        document.body.appendChild(btn);

        // Modal UI
        const modal = document.createElement('div');
        modal.id = 'u-bulk-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000000; display:none; justify-content:center; align-items:center; backdrop-filter:blur(5px);';
        
        modal.innerHTML = `
            <div style="background:#130a2a; border:2px solid #7c3aed; border-radius:15px; width:90%; max-width:500px; max-height:80vh; display:flex; flex-direction:column; color:white; font-family:sans-serif; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid #7c3aed; display:flex; justify-content:space-between; align-items:center; background:#0a0514;">
                    <h2 style="margin:0; color:#a78bfa;">📥 Select Chapters</h2>
                    <button id="u-close-modal" style="background:transparent; border:none; color:white; font-size:24px; cursor:pointer;">×</button>
                </div>
                <div style="padding:15px; display:flex; gap:10px; background:#1e293b;">
                    <button id="u-sel-all" style="flex:1; background:#3b82f6; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Select All</button>
                    <button id="u-desel-all" style="flex:1; background:#64748b; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Deselect All</button>
                </div>
                <div id="u-ch-list" style="flex:1; overflow-y:auto; padding:10px;">
                    <div style="text-align:center; padding:20px;">Loading chapters...</div>
                </div>
                <div style="padding:20px; border-top:1px solid #7c3aed; background:#0a0514; display:flex; flex-direction:column; gap:10px;">
                    <div id="u-bulk-progress" style="display:none; color:#22c55e; font-weight:bold; text-align:center;"></div>
                    <div style="display:flex; gap:10px;">
                        <button id="u-start-dl-zip" style="flex:1; background:linear-gradient(135deg,#a855f7,#7c3aed); color:white; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">⬇️ Download ZIP</button>
                        <button id="u-start-dl-pdf" style="flex:1; background:linear-gradient(135deg,#db2777,#be185d); color:white; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">📄 Download PDF</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        let chaptersData = [];

        btn.onclick = async () => {
            if (!isPremium) {
                window.open("https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26", '_blank');
            }
            modal.style.display = 'flex';
            const listEl = document.getElementById('u-ch-list');
            
            if (chaptersData.length === 0) {
                try {
                    const slug = getMangaSlug();
                    const res = await fetch(`https://utoon.net/wp-json/icmadara/v1/mangas/slug/${slug}/`);
                    const data = await res.json();
                    chaptersData = (data.mangas || [])[0]?.capitulos || [];
                    chaptersData.sort((a,b) => parseFloat(a.nombre.match(/[\d.]+/)?.[0]||0) - parseFloat(b.nombre.match(/[\d.]+/)?.[0]||0));
                } catch(e) {
                    listEl.innerHTML = '<div style="color:red; text-align:center;">Failed to load chapters via API.</div>';
                    return;
                }
            }

            listEl.innerHTML = chaptersData.map(ch => `
                <label style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #333; cursor:pointer;">
                    <input type="checkbox" class="u-ch-cb" value="${ch.id_capitulo}" data-slug="${ch.slug}" data-name="${ch.nombre}">
                    <span style="font-size:14px;">${ch.nombre}</span>
                </label>
            `).join('');
        };

        document.getElementById('u-close-modal').onclick = () => modal.style.display = 'none';
        document.getElementById('u-sel-all').onclick = () => document.querySelectorAll('.u-ch-cb').forEach(cb => cb.checked = true);
        document.getElementById('u-desel-all').onclick = () => document.querySelectorAll('.u-ch-cb').forEach(cb => cb.checked = false);

        async function startBulkProcess(format) {
            const selected = Array.from(document.querySelectorAll('.u-ch-cb:checked'));
            if (selected.length === 0) return alert("Select at least one chapter.");
            
            document.getElementById('u-start-dl-zip').disabled = true;
            document.getElementById('u-start-dl-pdf').disabled = true;
            const prog = document.getElementById('u-bulk-progress');
            prog.style.display = 'block';

            if (format === 'zip') await loadJSZip();
            if (format === 'pdf') await loadJSPDF();

            const masterZip = format === 'zip' ? new JSZip() : null;

            for (let i = 0; i < selected.length; i++) {
                const cb = selected[i];
                const cid = cb.value;
                const cname = cb.dataset.name.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Chapter";
                
                prog.innerText = `[${i+1}/${selected.length}] Fetching ${cname}...`;
                
                try {
                    const res = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${cid}/`);
                    const data = await res.json();
                    const rawList = data.imagenes || data.images || [];
                    const imgs = rawList.map(item => typeof item === 'string' ? item : (item.src || '')).filter(Boolean);
                    
                    if (imgs.length === 0) throw new Error("No images");

                    if (format === 'zip') {
                        prog.innerText = `[${i+1}/${selected.length}] Zipping images for ${cname}...`;
                        const chFolder = masterZip.folder(cname);
                        for (let j = 0; j < imgs.length; j++) {
                            try {
                                const ir = await fetch(imgs[j]);
                                const blob = await ir.blob();
                                chFolder.file(`image_${(j+1).toString().padStart(3,'0')}.jpg`, blob);
                            } catch(e) {}
                        }
                    } else if (format === 'pdf') {
                        prog.innerText = `[${i+1}/${selected.length}] Generating PDF for ${cname}...`;
                        const { jsPDF } = window.jspdf;
                        let pdf = null;
                        for (let j = 0; j < imgs.length; j++) {
                            try {
                                const ir = await fetch(imgs[j], {mode:'cors'});
                                const blob = await ir.blob();
                                const bitmap = await createImageBitmap(blob);
                                const canvas = document.createElement('canvas');
                                canvas.width = bitmap.width; canvas.height = bitmap.height;
                                const ctx = canvas.getContext('2d');
                                ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
                                ctx.drawImage(bitmap, 0, 0);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                const w = bitmap.width, h = bitmap.height;
                                bitmap.close();
                                const orientation = w > h ? 'landscape' : 'portrait';
                                if (j === 0) { pdf = new jsPDF({ orientation, unit: 'px', format: [w, h], compress: true }); }
                                else { pdf.addPage([w, h], orientation); }
                                pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h, '', 'FAST');
                            } catch(e) {}
                        }
                        if (pdf) {
                            const pdfBlob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(pdfBlob);
                            a.download = `${getMangaSlug()}_${cname}.pdf`;
                            a.click();
                            // Small delay so browser processes download prompt properly
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                } catch(e) {
                    console.error("Failed to process", cname, e);
                }
            }
            
            if (format === 'zip') {
                prog.innerText = "📦 Finalizing master ZIP file, please wait...";
                const content = await masterZip.generateAsync({type:"blob"});
                const a = document.createElement("a");
                a.href = URL.createObjectURL(content);
                a.download = `${getMangaSlug()}_Bulk_ZIP.zip`;
                a.click();
            }

            prog.innerText = "✅ Done! All chapters processed.";
            document.getElementById('u-start-dl-zip').disabled = false;
            document.getElementById('u-start-dl-pdf').disabled = false;
            setTimeout(() => { prog.style.display = 'none'; }, 5000);
        }

        document.getElementById('u-start-dl-zip').onclick = () => startBulkProcess('zip');
        document.getElementById('u-start-dl-pdf').onclick = () => startBulkProcess('pdf');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBulkDownload);
    } else {
        initBulkDownload();
    }
})();

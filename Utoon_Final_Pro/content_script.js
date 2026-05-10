(async function() {
    console.log("Utoon Pro Max: Content Script Loaded");

    async function injectBulkDownloadButtons() {
        const chaptersList = document.querySelectorAll('.wp-manga-chapter');
        if (chaptersList.length === 0) return;

        const chaptersContainer = document.querySelector('.listing-chapters_wrap') || document.querySelector('.main.version-chap');
        if (chaptersContainer) {
            const downloadAllBtn = document.createElement('button');
            downloadAllBtn.innerText = "Download All Chapters (PDF)";
            downloadAllBtn.style.cssText = "width: 100%; padding: 10px; margin-bottom: 10px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;";
            downloadAllBtn.onclick = async () => {
                if (!confirm("This will start downloading ALL chapters. Continue?")) return;
                const buttons = document.querySelectorAll('.utoon-pdf-btn');
                for (const btn of buttons) {
                    btn.click();
                    await new Promise(r => setTimeout(r, 2000)); // Gap to avoid rate limiting/browser hang
                }
            };
            chaptersContainer.prepend(downloadAllBtn);
        }

        chaptersList.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const btnContainer = document.createElement('span');
            btnContainer.style.cssText = "margin-left: 10px; display: inline-flex; gap: 5px;";

            const createBtn = (label, color, type) => {
                const btn = document.createElement('button');
                btn.className = type === 'pdf' ? 'utoon-pdf-btn' : '';
                btn.innerText = label;
                btn.style.cssText = `background: ${color}; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;`;
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalText = btn.innerText;
                    btn.innerText = "...";
                    btn.disabled = true;

                    try {
                        const chapterUrl = a.href;
                        const pathParts = new URL(chapterUrl).pathname.split('/').filter(Boolean);
                        const mSlug = pathParts[pathParts.length - 2];
                        const cSlug = pathParts[pathParts.length - 1];

                        const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`;
                        const mRes = await fetch(mangaApiUrl);
                        const mData = await mRes.json();
                        const mInfo = (mData.mangas || [])[0];
                        const chInfo = mInfo?.capitulos?.find(c => c.slug === cSlug || c.slug === cSlug.replace('.', '-'));

                        if (!chInfo) throw new Error("Info missing");

                        const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${chInfo.id_capitulo}/`);
                        const imgData = await imgRes.json();
                        const imgs = (imgData.imagenes || imgData.images || []).map(i => typeof i === 'string' ? i : i.src).filter(Boolean);

                        if (imgs.length === 0) throw new Error("No images");

                        chrome.runtime.sendMessage({
                            action: "bulk_download",
                            images: imgs,
                            name: `${mSlug}_\`,
                            type: type
                        });
                        btn.innerText = "Done";
                    } catch (err) { btn.innerText = "!"; }
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                };
                return btn;
            };

            btnContainer.appendChild(createBtn("PDF", "#db2777", "pdf"));
            btnContainer.appendChild(createBtn("ZIP", "#7c3aed", "zip"));
            li.appendChild(btnContainer);
        });
    }

    injectBulkDownloadButtons();

    if (document.querySelector('.read-container') || document.querySelector('.wp-manga-chapter-img')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    }
})();

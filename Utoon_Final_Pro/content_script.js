(async function() {
    console.log("Utoon Pro Max: Content Script Loaded");

    async function injectBulkDownloadButtons() {
        const chaptersList = document.querySelectorAll('.wp-manga-chapter');
        if (chaptersList.length === 0) return;

        const chaptersContainer = document.querySelector('.listing-chapters_wrap') || document.querySelector('.main.version-chap');

        chaptersList.forEach(li => {
            const a = li.querySelector('a');
            if (!a) return;

            const btnContainer = document.createElement('span');
            btnContainer.style.cssText = "margin-left: 10px; display: inline-flex; gap: 5px; vertical-align: middle;";

            const createBtn = (label, color, type) => {
                const btn = document.createElement('button');
                btn.className = type === 'pdf' ? 'utoon-pdf-btn' : '';
                btn.innerText = label;
                btn.style.cssText = `background: ${color}; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; height: 25px;`;

                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalText = btn.innerText;
                    btn.innerText = "...";
                    btn.disabled = true;

                    try {
                        const chapterUrl = a.href;
                        let mSlug, cSlug;

                        if (chapterUrl === "#" || chapterUrl.includes("javascript:void(0)")) {
                            // Locked chapter: get slug from text or parent
                            const pathParts = window.location.pathname.split('/').filter(Boolean);
                            mSlug = pathParts[pathParts.length - 1];
                            cSlug = a.innerText.trim().toLowerCase().replace(/\s+/g, '-');
                        } else {
                            const pathParts = new URL(chapterUrl).pathname.split('/').filter(Boolean);
                            mSlug = pathParts[pathParts.length - 2];
                            cSlug = pathParts[pathParts.length - 1];
                        }

                        if (type === 'read') {
                            // Custom action for Reading
                            window.UtoonStartReader(mSlug, cSlug);
                            btn.innerText = originalText;
                            btn.disabled = false;
                            return;
                        }

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
                            name: `${mSlug}_${cSlug}`,
                            type: type
                        });
                        btn.innerText = "Done";
                    } catch (err) {
                        console.error(err);
                        btn.innerText = "!";
                    }
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                };
                return btn;
            };

            // Add Read button (Green)
            btnContainer.appendChild(createBtn("Read", "#10b981", "read"));
            // Add PDF button (Pink)
            btnContainer.appendChild(createBtn("PDF", "#db2777", "pdf"));
            // Add ZIP button (Purple)
            btnContainer.appendChild(createBtn("ZIP", "#7c3aed", "zip"));

            li.appendChild(btnContainer);
        });
    }

    injectBulkDownloadButtons();

    // Export Start Reader function
    window.UtoonStartReader = (mSlug, cSlug) => {
        window.history.pushState({}, '', `/manga/${mSlug}/${cSlug}/`);
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    };

    if (document.querySelector('.read-container') || document.querySelector('.wp-manga-chapter-img')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    }
})();

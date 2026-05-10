(async function() {
    console.log("Utoon Pro Max: Content Script Loaded");

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .utoon-btn-group {
            margin-left: 10px;
            display: inline-flex;
            gap: 6px;
            vertical-align: middle;
        }
        .utoon-btn {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            color: white !important;
            padding: 4px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 800;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-decoration: none !important;
        }
        .utoon-btn:hover {
            transform: translateY(-1.5px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            filter: brightness(1.1);
        }
        .utoon-btn:active {
            transform: translateY(0);
        }
        .utoon-btn-read { background: linear-gradient(135deg, #10b981, #059669); }
        .utoon-btn-pdf { background: linear-gradient(135deg, #db2777, #9d174d); }
        .utoon-btn-zip { background: linear-gradient(135deg, #7c3aed, #4c1d95); }
        .utoon-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    `;
    document.head.appendChild(style);

    async function injectBulkDownloadButtons() {
        const chaptersList = document.querySelectorAll('.wp-manga-chapter');
        if (chaptersList.length === 0) return;

        chaptersList.forEach(li => {
            if (li.querySelector('.utoon-btn-group')) return;

            const a = li.querySelector('a');
            if (!a) return;

            const btnContainer = document.createElement('span');
            btnContainer.className = 'utoon-btn-group';

            const createBtn = (label, type) => {
                const btn = document.createElement('button');
                btn.className = `utoon-btn utoon-btn-${type}`;
                btn.innerText = label;

                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalText = btn.innerText;
                    btn.innerText = "...";
                    btn.disabled = true;

                    try {
                        const chapterUrl = a.href;
                        let mSlug, cSlug;

                        const pathParts = window.location.pathname.split('/').filter(Boolean);
                        mSlug = pathParts[pathParts.length - 1]; // Assume we are on manga index

                        if (chapterUrl === "#" || chapterUrl.includes("javascript:void(0)")) {
                            // Locked chapter: parse from text
                            // Format often: "Chapter 56" -> "chapter-56"
                            cSlug = a.innerText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                        } else {
                            try {
                                const urlObj = new URL(chapterUrl, window.location.origin);
                                const urlParts = urlObj.pathname.split('/').filter(Boolean);
                                mSlug = urlParts[urlParts.length - 2];
                                cSlug = urlParts[urlParts.length - 1];
                            } catch(e) {
                                cSlug = a.innerText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                            }
                        }

                        if (type === 'read') {
                            window.UtoonStartReader(mSlug, cSlug);
                            btn.innerText = originalText;
                            btn.disabled = false;
                            return;
                        }

                        // For PDF/ZIP, fetch images via API
                        const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`;
                        const mRes = await fetch(mangaApiUrl);
                        const mData = await mRes.json();
                        const mInfo = (mData.mangas || [])[0];
                        // Try exact slug or replace dots
                        const chInfo = mInfo?.capitulos?.find(c => c.slug === cSlug || c.slug === cSlug.replace('.', '-'));

                        if (!chInfo) throw new Error("Chapter info not found in API");

                        const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${chInfo.id_capitulo}/`);
                        const imgData = await imgRes.json();
                        const raw = imgData.imagenes || imgData.images || [];
                        const imgs = raw.map(i => typeof i === 'string' ? i : i.src).filter(Boolean);

                        if (imgs.length === 0) throw new Error("No images found for this chapter");

                        chrome.runtime.sendMessage({
                            action: "bulk_download",
                            images: imgs,
                            name: `${mSlug}_${cSlug}`,
                            type: type
                        });
                        btn.innerText = "DONE";
                    } catch (err) {
                        console.error("Utoon Error:", err);
                        btn.innerText = "ERR";
                    }
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                };
                return btn;
            };

            btnContainer.appendChild(createBtn("Read", "read"));
            btnContainer.appendChild(createBtn("PDF", "pdf"));
            btnContainer.appendChild(createBtn("ZIP", "zip"));

            li.appendChild(btnContainer);
        });
    }

    // Export Start Reader function to window
    window.UtoonStartReader = (mSlug, cSlug) => {
        console.log(`Starting Reader for ${mSlug}/${cSlug}`);
        window.history.pushState({}, '', `/manga/${mSlug}/${cSlug}/`);

        // Remove existing reader if any
        const oldReader = document.getElementById('u-reader-main');
        if (oldReader) oldReader.remove();
        window._u_reader_injected_real = false;

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    };

    // Initial injection
    injectBulkDownloadButtons();

    // Auto-trigger reader if on a chapter page
    if (document.querySelector('.read-container') || document.querySelector('.wp-manga-chapter-img') || window.location.pathname.includes('/chapter-')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    }

    // Re-inject on dynamic content changes (if user scrolls or filters)
    const observer = new MutationObserver(() => injectBulkDownloadButtons());
    observer.observe(document.body, { childList: true, subtree: true });

})();

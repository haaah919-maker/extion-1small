(async function() {
    console.log("Utoon Pro Max Legendary: Content Script Loaded");

    const style = document.createElement('style');
    style.innerHTML = `
        .utoon-btn-group {
            position: relative;
            z-index: 10000000;
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
        .utoon-btn-read { background: linear-gradient(135deg, #10b981, #059669); }
        .utoon-btn-pdf { background: linear-gradient(135deg, #db2777, #9d174d); }
        .utoon-btn-zip { background: linear-gradient(135deg, #7c3aed, #4c1d95); }
        .utoon-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .utoon-ghost-link {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 9999999;
            cursor: pointer;
            background: transparent;
        }
    `;
    document.head.appendChild(style);

    function getSlugs(li, a) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let mSlug = pathParts[pathParts.length - 1];
        let cSlug;

        const chapterUrl = a.href;
        if (chapterUrl === "#" || chapterUrl.includes("javascript:void(0)")) {
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
        return { mSlug, cSlug };
    }

    async function injectBulkDownloadButtons() {
        const chaptersList = document.querySelectorAll('.wp-manga-chapter');
        if (chaptersList.length === 0) return;

        chaptersList.forEach(li => {
            if (li.dataset.utoon_processed) return;
            li.dataset.utoon_processed = "true";

            const a = li.querySelector('a');
            if (!a) return;

            const { mSlug, cSlug } = getSlugs(li, a);
            const unlockedUrl = `https://utoon.net/manga/${mSlug}/${cSlug}/`;

            // Style the LI
            li.style.position = 'relative';
            li.style.border = "1px solid rgba(124, 58, 237, 0.3)";
            li.style.borderRadius = "8px";
            li.style.margin = "4px 0";
            li.style.padding = "4px 8px";
            li.style.transition = "0.3s";
            li.onmouseenter = () => li.style.borderColor = "#7c3aed";
            li.onmouseleave = () => li.style.borderColor = "rgba(124, 58, 237, 0.3)";

            // Ghost Link (The core of "Ghost Buttons")
            const ghost = document.createElement('a');
            ghost.className = 'utoon-ghost-link';
            ghost.href = unlockedUrl;
            ghost.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.UtoonStartReader(mSlug, cSlug);
            };
            li.appendChild(ghost);
            a.style.pointerEvents = 'none'; // Disable original link

            // Buttons Group
            const btnContainer = document.createElement('span');
            btnContainer.className = 'utoon-btn-group';

            const createBtn = (label, type) => {
                const btn = document.createElement('button');
                btn.className = `utoon-btn utoon-btn-${type}`;
                btn.innerText = label;
                btn.setAttribute('aria-label', `${label} Chapter`);
                btn.setAttribute('title', `${label} Chapter`);

                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (type === 'read') {
                        window.UtoonStartReader(mSlug, cSlug);
                        return;
                    }

                    const originalText = btn.innerText;
                    btn.innerText = "...";
                    btn.disabled = true;

                    try {
                        const mangaApiUrl = `https://utoon.net/wp-json/icmadara/v1/mangas/slug/${mSlug}/`;
                        const mRes = await fetch(mangaApiUrl);
                        const mData = await mRes.json();
                        const mInfo = (mData.mangas || [])[0];
                        const chInfo = mInfo?.capitulos?.find(c => c.slug === cSlug || c.slug === cSlug.replace('.', '-'));

                        if (!chInfo) throw new Error("Chapter not in API");

                        const imgRes = await fetch(`https://utoon.net/wp-json/icmadara/v1/capitulo/${chInfo.id_capitulo}/`);
                        const imgData = await imgRes.json();
                        const raw = imgData.imagenes || imgData.images || [];
                        const imgs = raw.map(i => typeof i === 'string' ? i : i.src).filter(Boolean);

                        if (imgs.length === 0) throw new Error("No images");

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

    window.UtoonStartReader = (mSlug, cSlug) => {
        console.log(`Starting Reader for ${mSlug}/${cSlug}`);
        window.history.pushState({}, '', `/manga/${mSlug}/${cSlug}/`);
        const oldReader = document.getElementById('u-reader-main');
        if (oldReader) oldReader.remove();
        window._u_reader_injected_real = false;
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    };

    injectBulkDownloadButtons();
    if (document.querySelector('.read-container') || document.querySelector('.wp-manga-chapter-img') || window.location.pathname.includes('/chapter-')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('reader_logic.js');
        (document.head || document.documentElement).appendChild(script);
    }

    const observer = new MutationObserver(() => injectBulkDownloadButtons());
    observer.observe(document.body, { childList: true, subtree: true });
})();

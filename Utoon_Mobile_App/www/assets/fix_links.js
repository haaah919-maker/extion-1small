(function() {
    console.log("Utoon Ultimate Pro: Link Fixer Active");

    function getSlugs(li, a) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let mSlug = pathParts[pathParts.length - 1];
        let cSlug;

        const chapterUrl = a.href;
        if (!chapterUrl || chapterUrl === "#" || chapterUrl.includes("javascript:void(0)")) {
            // Fallback to text matching if href is missing or invalid
            const text = a.textContent.trim();
            const match = text.match(/Chapter\s+([\d.]+)/i);
            if (match) {
                cSlug = "chapter-" + match[1].replace('.', '-');
            } else {
                cSlug = a.innerText.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').replace(/\./g, '-');
            }
        } else {
            try {
                const urlObj = new URL(chapterUrl, window.location.origin);
                const urlParts = urlObj.pathname.split('/').filter(Boolean);
                // URL structure: /manga/manga-slug/chapter-slug/
                if (urlParts.length >= 2) {
                    mSlug = urlParts[urlParts.length - 2];
                    cSlug = urlParts[urlParts.length - 1];
                } else {
                    cSlug = urlParts[urlParts.length - 1];
                }
            } catch(e) {
                cSlug = a.innerText.trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').replace(/\./g, '-');
            }
        }
        return { mSlug, cSlug };
    }

    function injectGhostButtons() {
        if (!window.location.href.includes('/manga/')) return;
        if (window.location.pathname.includes('/chapter-')) return;

        document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
            if (li.dataset.ghost_injected) return;

            const a = li.querySelector('a');
            if (!a) return;

            const { mSlug, cSlug } = getSlugs(li, a);
            if (!cSlug) return;

            li.dataset.ghost_injected = "true";
            const unlockedUrl = `https://utoon.net/manga/${mSlug}/${cSlug}/`;

            // Visual feedback
            li.style.position = 'relative';
            li.style.border = '1px solid rgba(124, 58, 237, 0.4)';
            li.style.borderRadius = '8px';
            li.style.margin = '5px 0';
            li.style.padding = '2px 8px';
            li.style.transition = '0.3s';
            li.style.background = 'rgba(124, 58, 237, 0.05)';

            li.onmouseenter = () => {
                li.style.borderColor = '#7c3aed';
                li.style.background = 'rgba(124, 58, 237, 0.1)';
            };
            li.onmouseleave = () => {
                li.style.borderColor = 'rgba(124, 58, 237, 0.4)';
                li.style.background = 'rgba(124, 58, 237, 0.05)';
            };

            const ghost = document.createElement('a');
            ghost.href = unlockedUrl;
            ghost.style.position = 'absolute';
            ghost.style.top = '0';
            ghost.style.left = '0';
            ghost.style.width = '100%';
            ghost.style.height = '100%';
            ghost.style.zIndex = '9999999';
            ghost.style.cursor = 'pointer';
            ghost.style.background = 'transparent';

            ghost.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                window.location.href = unlockedUrl;
            }, true);

            li.appendChild(ghost);
            a.style.pointerEvents = 'none';
        });
    }

    // Use MutationObserver for better performance than setInterval
    const observer = new MutationObserver(() => injectGhostButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    // Run once at start
    injectGhostButtons();
})();

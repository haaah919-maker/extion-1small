(function() {
    function injectGhostButtons() {
        if (!window.location.href.includes('/manga/')) return;
        
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const mangaSlug = pathParts[pathParts.length - 1];
        if (!mangaSlug || window.location.pathname.includes('/chapter-')) return;

        document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
            // Apply visual indication that extension is active
            li.style.border = '2px solid #7c3aed';
            li.style.borderRadius = '8px';
            li.style.margin = '5px 0';
            li.style.transition = '0.3s';

            if (li.dataset.ghost_injected) return;
            
            const a = li.querySelector('a');
            if (!a) return;

            const text = a.textContent.trim();
            const match = text.match(/Chapter\s+(\d+)/i);
            
            if (match) {
                li.dataset.ghost_injected = "true";
                const chNum = match[1];
                const unlockedUrl = `https://utoon.net/manga/${mangaSlug}/chapter-${chNum}/`;
                
                li.style.position = 'relative';
                
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
            }
        });
    }

    setInterval(injectGhostButtons, 1000);
    injectGhostButtons();
})();

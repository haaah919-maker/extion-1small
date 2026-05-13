(function() {
    function injectGhostButtons() {
        if (!window.location.href.includes('/manga/')) return;
        
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const mangaSlug = pathParts[pathParts.length - 1];
        if (!mangaSlug || window.location.pathname.includes('/chapter-')) return;

        document.querySelectorAll('li.wp-manga-chapter').forEach(li => {
            // Purple gradient border
            li.style.border = '2px solid transparent';
            li.style.backgroundImage = 'linear-gradient(rgba(10, 5, 20, 0.95), rgba(10, 5, 20, 0.95)), linear-gradient(135deg, #a855f7, #7c3aed)';
            li.style.backgroundOrigin = 'border-box';
            li.style.backgroundClip = 'padding-box, border-box';
            li.style.borderRadius = '8px';
            li.style.margin = '5px 0';
            li.style.transition = '0.3s ease';

            li.addEventListener('mouseenter', () => {
                li.style.boxShadow = '0 8px 16px rgba(168, 85, 247, 0.3)';
                li.style.transform = 'translateY(-2px)';
            });

            li.addEventListener('mouseleave', () => {
                li.style.boxShadow = 'none';
                li.style.transform = 'translateY(0)';
            });

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

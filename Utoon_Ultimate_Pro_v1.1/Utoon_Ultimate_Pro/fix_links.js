(function() {
    function unlockChapters() {
        const mangaUrl = window.location.href;
        if (!mangaUrl.includes('/manga/')) return;

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const mangaSlug = pathParts[pathParts.length - 1];
        if (!mangaSlug) return;

        document.querySelectorAll('li.wp-manga-chapter.premium-block').forEach(li => {
            const a = li.querySelector('a[href="#"]');
            if (a) {
                const text = a.textContent.trim();
                const match = text.match(/Chapter\s+(\d+)/i);
                if (match) {
                    const chNum = match[1];
                    const newUrl = `https://utoon.net/manga/${mangaSlug}/chapter-${chNum}/`;
                    a.href = newUrl;
                    a.style.color = '#7c3aed'; // Highlight unlocked
                    a.innerHTML += ' <span style="font-size:10px; color:#10b981;">(PRO Unlocked)</span>';

                    // Remove the lock icon if it exists
                    const lock = a.querySelector('.fa-lock');
                    if (lock) lock.remove();
                }
            }
        });
    }

    // Run on load and whenever the list might update
    unlockChapters();
    const observer = new MutationObserver(unlockChapters);
    observer.observe(document.body, { childList: true, subtree: true });
})();

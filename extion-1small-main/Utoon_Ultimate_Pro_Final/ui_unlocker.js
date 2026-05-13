(function() {
    if (window._u_ui_injected) return;
    window._u_ui_injected = true;

    const style = document.createElement('style');
    style.innerHTML = `
        /* AGGRESSIVE CLEANUP */
        .vip-lock, .chapter-lock, .paywall, #vip-modal, .coin-modal, .ad-container, .adsbygoogle, .modal-backdrop, .modal { 
            display: none !important; 
            visibility: hidden !important; 
            opacity: 0 !important; 
            pointer-events: none !important; 
        }
        body.modal-open { overflow: auto !important; padding: 0 !important; }
        
        body, .site-content, .c-page-content, .wrap, .main-col-inner { 
            background-color: #0a0514 !important; 
            color: #e2d9f3 !important; 
        }
        
        .site-header, .navbar {
            background: rgba(10, 5, 25, 0.95) !important;
            border-bottom: 2px solid #5b21b6 !important;
        }

        .wp-manga-chapter { 
            opacity: 1 !important; 
            pointer-events: auto !important; 
            background: linear-gradient(135deg, rgba(91, 33, 182, 0.1), rgba(59, 7, 100, 0.2)) !important; 
            border: 1px solid #5b21b6 !important; 
            margin-bottom: 8px !important; 
            border-radius: 8px !important; 
            display: flex !important;
            align-items: center;
        }
        .wp-manga-chapter a { 
            color: #e2d9f3 !important; 
            font-weight: bold !important; 
            display: block !important; 
            padding: 12px 15px !important; 
            width: 100%;
        }
        .wp-manga-chapter::after {
            content: "🔓 Premium";
            color: #a78bfa;
            font-size: 11px;
            font-weight: bold;
            margin-right: 15px;
            background: rgba(124, 58, 237, 0.2);
            padding: 3px 8px;
            border-radius: 4px;
            border: 1px solid #7c3aed;
        }
    `;
    document.head.appendChild(style);

    // Remove any existing backdrops immediately
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    document.body.classList.remove('modal-open');

    console.log("Utoon Premium UI Cleaned!");
})();

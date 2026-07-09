const CONFIG = {
    // Localhost → Flask dev server directly
    // GitHub Pages (aryanjha209.github.io) → Vercel backend API
    // Vercel (aryanjha.me) → same-origin API via Vercel rewrites
    API_BASE_URL: (() => {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        if (h.includes('github.io')) {
            // GitHub Pages has no backend — point API calls to Vercel
            return 'https://aryanjha.me';
        }
        // Vercel deployment — use same-origin (rewrites handle /api/*)
        return '';
    })()
};

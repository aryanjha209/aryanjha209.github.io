// Deployment routing:
//   localhost / 127.0.0.1  → Flask dev server on :5000  (full URL needed)
//   GitHub Pages            → static-only; API calls go to Vercel backend
//   Vercel (aryanjha.me)    → frontend + backend on SAME domain → use relative ""
//
// ⚠️  If you serve the frontend from GitHub Pages, set GITHUB_PAGES_HOSTNAME
//     to your GH Pages domain so API calls are routed to Vercel.
const GITHUB_PAGES_HOSTNAME = "aryanjha205.github.io";
const VERCEL_BACKEND_URL    = "https://aryanjha209-github-io.vercel.app";

const CONFIG = {
    API_BASE_URL: (() => {
        const h = window.location.hostname;
        const p = window.location.protocol;
        if (h === 'localhost' || h === '127.0.0.1') {
            // Local Flask dev server
            return 'http://localhost:5000';
        }
        if (p === 'file:') {
            // Opened directly as local file — route to Vercel backend
            return VERCEL_BACKEND_URL;
        }
        if (h === GITHUB_PAGES_HOSTNAME || h.endsWith('.github.io') || h === 'aryanjha.me' || h === 'www.aryanjha.me') {
            // Static hosts (GitHub Pages/custom domains) — route to Vercel backend
            return VERCEL_BACKEND_URL;
        }
        // Vercel deployment (same origin) — same-origin, use relative URLs
        return '';
    })()
};

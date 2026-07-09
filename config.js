// GitHub Pages  → frontend only  → API calls go to Vercel backend
// Vercel         → backend only  → /api/* routes (Flask + MongoDB)
// localhost      → Flask dev server (both frontend + backend)
//
// ⚠️  After your first Vercel deploy, copy your project URL and paste below.
//     Example: "https://aryanjha209-github-io-main.vercel.app"
const VERCEL_BACKEND_URL = "https://aryanjha209-github-io-main.vercel.app";

const CONFIG = {
    API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : VERCEL_BACKEND_URL
};

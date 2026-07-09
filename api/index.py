import sys
import os

# ─────────────────────────────────────────────────────────────
# Vercel entrypoint — bridges to the Flask app in backend/api/
# Vercel looks for `app` (WSGI handler) in this file.
# ─────────────────────────────────────────────────────────────

_root        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend     = os.path.join(_root, "backend")
_backend_api = os.path.join(_root, "backend", "api")

# Make backend packages importable
if _backend not in sys.path:
    sys.path.insert(0, _backend)
if _backend_api not in sys.path:
    sys.path.insert(0, _backend_api)

# Load .env only if the file exists (not present on Vercel — use dashboard env vars)
from dotenv import load_dotenv
_env_file = os.path.join(_backend, ".env")
if os.path.exists(_env_file):
    load_dotenv(_env_file, override=False)  # Don't override vars already set in environment

# Import the Flask WSGI app — Vercel's Python runtime calls app(environ, start_response)
from index import app  # noqa: E402, F401

import sys
import os

# ─────────────────────────────────────────────────────────────
# Vercel entrypoint for the Flask app.
# Vercel requires a Python serverless function to live inside
# an /api directory at the project root. This file bridges to
# the real Flask application located in backend/api/index.py.
# ─────────────────────────────────────────────────────────────

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend     = os.path.join(_root, "backend")
_backend_api = os.path.join(_root, "backend", "api")

# Make backend packages importable
sys.path.insert(0, _backend)
sys.path.insert(0, _backend_api)

# Load .env from the backend directory before importing the app
from dotenv import load_dotenv
load_dotenv(os.path.join(_backend, ".env"))

# Import the Flask app — Vercel's Python runtime looks for `app`
from index import app  # noqa: E402, F401
